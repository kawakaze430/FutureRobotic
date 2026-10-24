import type { Db } from './db.js';
import { audit, fail, hash, id, iso, lock, nextCursor, pageCursor, scope, type Principal } from './common.js';
import { enqueue } from './jobs.js';
import { QuotaService } from './quota.js';
import {allowedModel} from './protection.js';
import {characters} from './input-policy.js';
import {FileService} from './account-services.js';
import type {ObjectStore} from './content.js';
export const toolNames=['convert','generate','explain','fix','refactor','review','tests','chat'] as const;
export interface RunInput { tool:typeof toolNames[number]; source:string; instructions?:string; language:string; targetLanguage?:string;modelId?:string;fileIds?:string[];fileRevisions?:{id:string;revision:number}[];chatThreadId?:string;chatMessage?:string;historyMode?:'cloud'|'local'|'none' }
export class RunService {
  quota:QuotaService;
  constructor(private db:Db) {this.quota=new QuotaService(db);}
  async create(p:Principal,input:RunInput,key:string,trace:string) {
    if(!/^[A-Za-z0-9_-]{8,100}$/.test(key)) fail('INVALID_IDEMPOTENCY_KEY');
    if(!toolNames.includes(input.tool)||typeof input.source!=='string'||!input.source.trim()||characters(input.source)>100000||!input.language||input.language.length>60||(input.instructions?.length??0)>3000) fail('INVALID_RUN');
    if((input.fileIds?.length??0)>5||new Set(input.fileIds??[]).size!==(input.fileIds??[]).length)fail('INVALID_CONTEXT_FILES');
    if(input.fileRevisions&&(!Array.isArray(input.fileRevisions)||input.fileRevisions.length!==(input.fileIds?.length??0)||new Set(input.fileRevisions.map(f=>f.id)).size!==input.fileRevisions.length||input.fileRevisions.some(f=>!input.fileIds?.includes(f.id)||!Number.isSafeInteger(f.revision)||f.revision<1)))fail('INVALID_CONTEXT_REVISIONS');
    if((input.chatMessage?.length??0)>4000)fail('MESSAGE_TOO_LARGE');
    const normalized={tool:input.tool,source:input.source,instructions:input.instructions??'',language:input.language,targetLanguage:input.targetLanguage??null,model:input.modelId??'standard-auto',fileIds:input.fileIds??[],chatThreadId:input.chatThreadId??null,chatMessage:input.chatMessage??null,historyMode:input.historyMode??'cloud',...(input.fileRevisions?{fileRevisions:input.fileRevisions}: {})};
    if(!['cloud','local','none'].includes(normalized.historyMode)||normalized.historyMode!=='cloud'&&normalized.chatThreadId)fail('INVALID_HISTORY_MODE');
    const fingerprint=hash(JSON.stringify(normalized));
    return this.db.transaction(async tx=>{
      await scope(tx,p); await lock(tx,`run:${p.workspaceId}:${key}`);
      const prior=await tx.query('SELECT id,status,request_hash FROM tool_runs WHERE workspace_id=$1 AND owner_id=$2 AND idempotency_key=$3',[p.workspaceId,p.userId,key]);
      if(prior.rowCount) {
        if(prior.rows[0].request_hash!==fingerprint) fail('IDEMPOTENCY_CONFLICT',409);
        return {id:prior.rows[0].id as string,status:prior.rows[0].status as string,replayed:true};
      }
      const policy=await this.quota.policy(tx,p);
      await allowedModel(tx,p,normalized.model);
      if(characters(input.source)+characters(input.instructions??'')>policy.contextLimit) fail('CONTEXT_LIMIT',413);
      const runId=id();
      await tx.query('INSERT INTO tool_runs(id,workspace_id,owner_id,tool,source,instructions,language,target_language,model,idempotency_key,request_hash,trace_id,retention_until,history_mode) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',[runId,p.workspaceId,p.userId,normalized.tool,normalized.source,normalized.instructions,normalized.language,normalized.targetLanguage,normalized.model,key,fingerprint,trace,iso(Date.now()+(normalized.historyMode==='cloud'?30*86400000:3600000)),normalized.historyMode]);
      await this.quota.reserve(tx,p,runId,policy.period);
      await new FileService(tx,{} as ObjectStore).freeze(tx,p,runId,normalized.fileIds,normalized.fileRevisions);
      const totalContext=await tx.query('SELECT coalesce(sum(length(content)),0)::int AS n FROM run_context_files WHERE run_id=$1',[runId]);
      if(characters(input.source)+characters(input.instructions??'')+totalContext.rows[0].n>policy.contextLimit)fail('CONTEXT_LIMIT',413);
      const user=(await tx.query('SELECT preferences FROM users WHERE id=$1',[p.userId])).rows[0];
      await tx.query('UPDATE tool_runs SET evaluation_allowed=$2 WHERE id=$1',[runId,normalized.historyMode==='cloud'&&user.preferences.evaluationOptOut===false]);
      if(normalized.chatThreadId){
        const thread=await tx.query('SELECT id FROM chat_threads WHERE id=$1 AND workspace_id=$2 AND owner_id=$3 AND archived_at IS NULL FOR UPDATE',[normalized.chatThreadId,p.workspaceId,p.userId]);
        if(!thread.rowCount)fail('NOT_FOUND',404);
        await tx.query('UPDATE tool_runs SET chat_thread_id=$2 WHERE id=$1',[runId,normalized.chatThreadId]);
        await tx.query('INSERT INTO chat_messages(id,thread_id,workspace_id,owner_id,role,content,run_id,operation_key) VALUES($1,$2,$3,$4,\'user\',$5,$6,$7)',[id(),normalized.chatThreadId,p.workspaceId,p.userId,normalized.chatMessage??input.source,runId,`user:${key}`]);
        await tx.query('UPDATE users SET selected_chat_id=$2 WHERE id=$1',[p.userId,normalized.chatThreadId]);
      }
      await tx.query('INSERT INTO run_events(run_id,event_type,data) VALUES($1,\'status\',$2)',[runId,JSON.stringify({status:'queued'})]);
      await enqueue(tx,'dispatch',`dispatch:${runId}`,{runId},trace);
      await audit(tx,p,'run.created',runId,trace,{tool:input.tool});
      return {id:runId,status:'queued',replayed:false};
    });
  }
  async get(p:Principal,runId:string):Promise<Record<string,any> & {results:Record<string,any>[]}> {
    await scope(this.db,p);
    const r=await this.db.query('SELECT id,tool,source,instructions,language,target_language,model,status,error_code,created_at,updated_at,history_mode,history_deleted_at FROM tool_runs WHERE id=$1 AND workspace_id=$2 AND owner_id=$3',[runId,p.workspaceId,p.userId]);
    if(!r.rowCount) fail('NOT_FOUND',404);
    const versions=await this.db.query('SELECT id,version,content,created_at,origin FROM result_versions WHERE run_id=$1 AND workspace_id=$2 AND owner_id=$3 ORDER BY version',[runId,p.workspaceId,p.userId]);
    const context=await this.db.query('SELECT f.name,f.sha256,r.revision,f.original_characters,f.included_characters FROM run_context_files f JOIN file_revisions r ON r.id=f.revision_id WHERE f.run_id=$1 AND f.workspace_id=$2 AND f.owner_id=$3',[runId,p.workspaceId,p.userId]);
    return {...r.rows[0],results:versions.rows,contextFiles:context.rows};
  }
  async list(p:Principal,cursor?:string,limit=20) {
    await scope(this.db,p);const c=pageCursor(cursor);
    const r=await this.db.query('SELECT id,tool,language,status,created_at,(SELECT origin FROM result_versions v WHERE v.run_id=tool_runs.id ORDER BY version DESC LIMIT 1) AS result_origin FROM tool_runs WHERE workspace_id=$1 AND owner_id=$2 AND history_mode=\'cloud\' AND history_deleted_at IS NULL AND retention_until>now() AND ($3::timestamptz IS NULL OR (created_at,id)<($3::timestamptz,$4::uuid)) ORDER BY created_at DESC,id DESC LIMIT $5',[p.workspaceId,p.userId,c?.at??null,c?.id??null,Math.min(50,limit)]);
    return {items:r.rows,nextCursor:nextCursor(r.rows,Math.min(50,limit))};
  }
  async applyResult(p:Principal,runId:string,content:string,expectedVersion:number,key:string){
    if(!content.trim()||characters(content)>200000||!Number.isInteger(expectedVersion)||expectedVersion<1||!/^[\w-]{8,100}$/.test(key))fail('INVALID_RESULT_VERSION');
    return this.db.transaction(async tx=>{
      await scope(tx,p);const run=await tx.query("SELECT status,history_mode,history_deleted_at FROM tool_runs WHERE id=$1 AND workspace_id=$2 AND owner_id=$3 AND retention_until>now() FOR UPDATE",[runId,p.workspaceId,p.userId]);
      if(!run.rowCount||run.rows[0].history_deleted_at)fail('NOT_FOUND',404);
      if(run.rows[0].status!=='completed'||run.rows[0].history_mode!=='cloud')fail('RESULT_NOT_EDITABLE',409);
      const prior=await tx.query('SELECT version,content FROM result_versions WHERE run_id=$1 AND operation_key=$2',[runId,key]);
      if(prior.rowCount){if(prior.rows[0].content!==content||prior.rows[0].version!==expectedVersion+1)fail('IDEMPOTENCY_CONFLICT',409);return {version:prior.rows[0].version,replayed:true};}
      const latest=(await tx.query('SELECT max(version)::int AS version FROM result_versions WHERE run_id=$1',[runId])).rows[0].version;
      if(latest!==expectedVersion)fail('VERSION_CONFLICT',409);
      if(latest>=100)fail('RESULT_VERSION_LIMIT',413);
      await tx.query("INSERT INTO result_versions(id,run_id,workspace_id,owner_id,version,content,origin,operation_key) VALUES($1,$2,$3,$4,$5,$6,'user_applied_assistant',$7)",[id(),runId,p.workspaceId,p.userId,latest+1,content,key]);
      await audit(tx,p,'result.user_applied',runId,'result',{version:latest+1});return {version:latest+1,replayed:false};
    });
  }
  async cancel(p:Principal,runId:string,trace:string) {
    return this.db.transaction(async tx=>{
      await scope(tx,p);
      const r=await tx.query('SELECT status FROM tool_runs WHERE id=$1 AND workspace_id=$2 AND owner_id=$3 FOR UPDATE',[runId,p.workspaceId,p.userId]);
      if(!r.rowCount) fail('NOT_FOUND',404);
      const state=r.rows[0].status;
      if(state==='queued') {
        await tx.query('UPDATE tool_runs SET status=\'cancelled\',updated_at=now() WHERE id=$1',[runId]);
        await this.quota.finalize(tx,runId,'released');
      } else if(['dispatching','running'].includes(state)) {
        await tx.query('UPDATE tool_runs SET status=\'cancel_requested\',updated_at=now() WHERE id=$1',[runId]);
      }
      await audit(tx,p,'run.cancel_requested',runId,trace);
      return {id:runId,status:state==='queued'?'cancelled':['dispatching','running'].includes(state)?'cancel_requested':state};
    });
  }
  async saveNote(p:Principal,runId:string,content:string,expectedVersion:number|null) {
    if(content.length>50000) fail('NOTE_TOO_LARGE',413);
    return this.db.transaction(async tx=>{
      await scope(tx,p);await lock(tx,`note:${runId}`);
      const run=await tx.query('SELECT id FROM tool_runs WHERE id=$1 AND workspace_id=$2 AND owner_id=$3',[runId,p.workspaceId,p.userId]);
      if(!run.rowCount) fail('NOT_FOUND',404);
      const existing=await tx.query('SELECT id,version FROM notes WHERE run_id=$1 AND workspace_id=$2 AND owner_id=$3 FOR UPDATE',[runId,p.workspaceId,p.userId]);
      if(existing.rowCount) {
        if(expectedVersion!==existing.rows[0].version) fail('VERSION_CONFLICT',409);
        return (await tx.query('UPDATE notes SET content=$2,version=version+1,updated_at=now() WHERE id=$1 RETURNING id,version',[existing.rows[0].id,content])).rows[0];
      }
      if(expectedVersion!==null) fail('VERSION_CONFLICT',409);
      return (await tx.query('INSERT INTO notes(id,workspace_id,owner_id,run_id,content) VALUES($1,$2,$3,$4,$5) RETURNING id,version',[id(),p.workspaceId,p.userId,runId,content])).rows[0];
    });
  }
}
