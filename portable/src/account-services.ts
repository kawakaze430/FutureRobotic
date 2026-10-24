import type {Db} from './db.js';
import {audit,fail,hash,id,iso,lock,nextCursor,pageCursor,scope,token,type Principal} from './common.js';
import {ContentService,type ObjectStore} from './content.js';
import {enqueue} from './jobs.js';
import {QuotaService} from './quota.js';
import {fileUsage,reserveFileCapacity,validTextContent} from './file-capacity.js';
import {characters,takeCharacters} from './input-policy.js';
import {excludedFile} from './product-policy.js';
export class AccountService {
 constructor(private db:Db){}
 async profile(p:Principal){return this.db.transaction(async tx=>{await scope(tx,p);const row=(await tx.query<{id:string;email:string;display_name:string;preferences:Record<string,any>;selected_chat_id:string|null}>('SELECT id,email,display_name,preferences,selected_chat_id FROM users WHERE id=$1',[p.userId])).rows[0];const quota=new QuotaService(tx),policy=await quota.policy(tx,p);const balance=(await tx.query('SELECT granted,reserved,consumed,granted-reserved-consumed AS available FROM allowance_accounts WHERE workspace_id=$1 AND owner_id=$2 AND period_key=$3',[p.workspaceId,p.userId,policy.period])).rows[0]??{granted:0,reserved:0,consumed:0,available:0};return {...row,entitlement:{...policy,balance},files:await fileUsage(tx,p)};});}
 async update(p:Principal,value:{displayName?:string;evaluationOptOut?:boolean;notifications?:boolean;editor?:{dark:boolean;lineNumbers:boolean;fontSize:number};pins?:string[];historyMode?:'cloud'|'local'|'none'}){
  if(value.displayName!==undefined&&(typeof value.displayName!=='string'||value.displayName.length>100))fail('INVALID_PROFILE');
  if(value.editor&&(![12,13,14,15,16].includes(value.editor.fontSize)||typeof value.editor.dark!=='boolean'||typeof value.editor.lineNumbers!=='boolean'))fail('INVALID_PREFERENCES');
  if(value.pins&&(!Array.isArray(value.pins)||value.pins.length>8||new Set(value.pins).size!==value.pins.length||value.pins.some(v=>typeof v!=='string'||v.length>125||!/^.+ → .+$/.test(v))))fail('INVALID_PREFERENCES');
  if(value.historyMode&&!['cloud','local','none'].includes(value.historyMode))fail('INVALID_PREFERENCES');
  return this.db.transaction(async tx=>{
   await scope(tx,p);const prefs:Record<string,unknown>={};
   if(value.editor)prefs.editor=value.editor;
   if(value.pins)prefs.pins=value.pins;
   if(value.historyMode)prefs.historyMode=value.historyMode;
   if(value.evaluationOptOut!==undefined)prefs.evaluationOptOut=value.evaluationOptOut;
   if(value.notifications!==undefined)prefs.notifications=value.notifications;
   await tx.query('UPDATE users SET display_name=coalesce($2,display_name),preferences=preferences||$3::jsonb WHERE id=$1',[p.userId,value.displayName??null,JSON.stringify(prefs)]);
   if(value.evaluationOptOut===true){await tx.query('DELETE FROM evaluation_candidates WHERE owner_id=$1',[p.userId]);await tx.query('UPDATE tool_runs SET evaluation_allowed=false WHERE owner_id=$1',[p.userId]);}
   await audit(tx,p,'account.preferences_updated',p.userId,'account',{evaluationOptOut:value.evaluationOptOut??true});
   return (await tx.query('SELECT id,email,display_name,preferences,selected_chat_id FROM users WHERE id=$1',[p.userId])).rows[0];
  });
 }
 async selectChat(p:Principal,threadId:string|null){
  await scope(this.db,p);
  if(threadId!==null)await new ContentService(this.db,{} as ObjectStore).thread(p,threadId);
  await this.db.query('UPDATE users SET selected_chat_id=$2 WHERE id=$1',[p.userId,threadId]);return {id:threadId};
 }
 async ticket(p:Principal,subject:string,message:string){
  if(!subject.trim()||subject.length>200||message.length<10||message.length>10000)fail('INVALID_SUPPORT_TICKET');
  return this.db.transaction(async tx=>{
   await scope(tx,p);const subjectHash=hash(p.userId),hour=iso(Math.floor(Date.now()/3600000)*3600000);await lock(tx,`support-rate:${p.userId}`);
   const rate=await tx.query("INSERT INTO auth_windows(subject_hash,operation,window_start) VALUES($1,'support', $2) ON CONFLICT(subject_hash,operation,window_start) DO UPDATE SET hits=auth_windows.hits+1 RETURNING hits",[subjectHash,hour]);if(rate.rows[0].hits>5)fail('SUPPORT_RATE_LIMIT',429);
   const ticketId=id();await tx.query('INSERT INTO support_tickets(id,workspace_id,owner_id,subject,message) VALUES($1,$2,$3,$4,$5)',[ticketId,p.workspaceId,p.userId,subject,message]);return {id:ticketId,status:'open'};
  });
 }
 async tickets(p:Principal,ticketId?:string){await scope(this.db,p);const r=await this.db.query('SELECT id,subject,message,status,created_at FROM support_tickets WHERE workspace_id=$1 AND owner_id=$2 AND ($3::uuid IS NULL OR id=$3) ORDER BY created_at DESC LIMIT 50',[p.workspaceId,p.userId,ticketId??null]);if(ticketId&&!r.rowCount)fail('NOT_FOUND',404);return r.rows;}
 async deleteHistory(p:Principal,runId:string){
  return this.db.transaction(async tx=>{
   await scope(tx,p);const r=await tx.query('SELECT status FROM tool_runs WHERE id=$1 AND workspace_id=$2 AND owner_id=$3 FOR UPDATE',[runId,p.workspaceId,p.userId]);
   if(!r.rowCount)fail('NOT_FOUND',404);if(!['completed','failed','cancelled','uncertain'].includes(r.rows[0].status))fail('RUN_NOT_TERMINAL',409);
   await tx.query('UPDATE tool_runs SET source=\'\',instructions=\'\',retention_until=now(),history_deleted_at=now() WHERE id=$1',[runId]);
   await tx.query('UPDATE notes SET content=\'\' WHERE run_id=$1',[runId]);
   await tx.query('UPDATE chat_messages SET content=\'\' WHERE run_id=$1',[runId]);
   await tx.query('UPDATE share_snapshots SET result=\'\' WHERE share_id IN(SELECT id FROM shares WHERE run_id=$1)',[runId]);
   await tx.query('UPDATE result_versions SET content=\'\' WHERE run_id=$1',[runId]);
   await tx.query('UPDATE run_context_files SET content=\'\' WHERE run_id=$1',[runId]);
   await tx.query('DELETE FROM run_events WHERE run_id=$1',[runId]);
   await tx.query('UPDATE shares SET revoked_at=now() WHERE run_id=$1',[runId]);
   await tx.query('DELETE FROM evaluation_candidates WHERE run_id=$1',[runId]);
   await audit(tx,p,'history.deleted',runId,'history');return {deleted:true};
  });
 }
 async evaluationDataset(){
  return (await this.db.query('SELECT r.id,r.source,v.content FROM evaluation_candidates e JOIN tool_runs r ON r.id=e.run_id JOIN users u ON u.id=e.owner_id JOIN result_versions v ON v.run_id=r.id AND v.version=1 WHERE u.status=\'active\' AND (u.preferences->>\'evaluationOptOut\')=\'false\' AND r.evaluation_allowed=true AND r.status=\'completed\' AND r.history_deleted_at IS NULL AND r.history_mode=\'cloud\' AND r.retention_until>now()')).rows;
 }
}
export class FileService {
 constructor(private db:Db,private objects:ObjectStore){}
 async list(p:Principal,cursor?:string,limit=20){await scope(this.db,p);const c=pageCursor(cursor);limit=Math.max(1,Math.min(limit,50));const r=await this.db.query("SELECT f.id,f.name,f.status,f.created_at,r.revision,r.size_bytes,r.sha256,r.characters FROM files f JOIN LATERAL(SELECT revision,size_bytes,sha256,coalesce(length(extracted_text),0)::int AS characters FROM file_revisions WHERE file_id=f.id ORDER BY revision DESC LIMIT 1) r ON true WHERE f.workspace_id=$1 AND f.owner_id=$2 AND f.status<>'deleted' AND ($3::timestamptz IS NULL OR (f.created_at,f.id)<($3::timestamptz,$4::uuid)) ORDER BY f.created_at DESC,f.id DESC LIMIT $5",[p.workspaceId,p.userId,c?.at??null,c?.id??null,limit]);return {items:r.rows,nextCursor:nextCursor(r.rows,limit),usage:await fileUsage(this.db,p)};}
 async revisions(p:Principal,fileId:string){await scope(this.db,p);const rows=await this.db.query("SELECT r.revision,r.sha256,r.size_bytes,r.created_at FROM file_revisions r JOIN files f ON f.id=r.file_id WHERE f.id=$1 AND f.workspace_id=$2 AND f.owner_id=$3 AND f.status='ready' ORDER BY r.revision DESC LIMIT 20",[fileId,p.workspaceId,p.userId]);if(!rows.rowCount)fail('NOT_FOUND',404);return {items:rows.rows};}

 async revision(p:Principal,fileId:string,content:string,expectedRevision:number,requestKey:string){
  if(!validTextContent(content)||!Number.isInteger(expectedRevision)||expectedRevision<1||!/^[\w-]{8,100}$/.test(requestKey))fail('INVALID_REVISION');
  return this.db.transaction(async tx=>{
   await scope(tx,p);await lock(tx,`files-capacity:${p.workspaceId}`);const file=await tx.query('SELECT name,status FROM files WHERE id=$1 AND workspace_id=$2 AND owner_id=$3 FOR UPDATE',[fileId,p.workspaceId,p.userId]);
   if(!file.rowCount||file.rows[0].status!=='ready')fail('NOT_FOUND',404);
   const objectKey=`text/${p.workspaceId}/${hash(fileId+':'+requestKey)}`;
   const prior=await tx.query('SELECT revision,sha256 FROM file_revisions WHERE object_key=$1 AND owner_id=$2',[objectKey,p.userId]);
   if(prior.rowCount){if(prior.rows[0].sha256!==hash(content))fail('IDEMPOTENCY_CONFLICT',409);return {id:fileId,revision:prior.rows[0].revision};}
   const current=await tx.query('SELECT max(revision)::int AS revision FROM file_revisions WHERE file_id=$1',[fileId]);
   if(current.rows[0].revision!==expectedRevision)fail('VERSION_CONFLICT',409);
   if(expectedRevision>=20)fail('FILE_REVISION_LIMIT',413);
   await reserveFileCapacity(tx,p,Buffer.byteLength(content),0);
   await this.objects.put(objectKey,Buffer.from(content));
   const revision=expectedRevision+1;
   await tx.query('INSERT INTO file_revisions(id,file_id,workspace_id,owner_id,revision,object_key,sha256,size_bytes,media_type,extraction_status,extracted_text) VALUES($1,$2,$3,$4,$5,$6,$7,$8,\'text/plain\',\'ready\',$9)',[id(),fileId,p.workspaceId,p.userId,revision,objectKey,hash(content),Buffer.byteLength(content),content]);
   await audit(tx,p,'file.revised',fileId,'file',{revision});return {id:fileId,revision};
  });
 }
 async download(p:Principal,fileId:string){
  await scope(this.db,p);const r=await this.db.query('SELECT f.name,r.object_key,r.sha256,r.size_bytes FROM files f JOIN file_revisions r ON f.id=r.file_id WHERE f.id=$1 AND f.workspace_id=$2 AND f.owner_id=$3 AND f.status=\'ready\' ORDER BY r.revision DESC LIMIT 1',[fileId,p.workspaceId,p.userId]);
  if(!r.rowCount)fail('NOT_FOUND',404);const bytes=await this.objects.get(r.rows[0].object_key);
  if(bytes.length!==Number(r.rows[0].size_bytes)||hash(Buffer.from(bytes).toString('utf8'))!==r.rows[0].sha256)fail('OBJECT_INTEGRITY_FAILURE',503);
  return {name:r.rows[0].name as string,bytes};
 }
 async freeze(tx:Db,p:Principal,runId:string,fileIds:string[]){
  for(const fileId of fileIds){
   const r=await tx.query('SELECT f.name,r.id,r.sha256,r.extracted_text FROM files f JOIN file_revisions r ON r.file_id=f.id WHERE f.id=$1 AND f.workspace_id=$2 AND f.owner_id=$3 AND f.status=\'ready\' AND r.extraction_status=\'ready\' ORDER BY r.revision DESC LIMIT 1',[fileId,p.workspaceId,p.userId]);
   if(!r.rowCount)fail('CONTEXT_FILE_UNAVAILABLE',404);const f=r.rows[0];if(excludedFile(f.name))fail('CONTEXT_FILE_EXCLUDED');
   await tx.query('INSERT INTO run_context_files(run_id,revision_id,workspace_id,owner_id,name,sha256,content,original_characters,included_characters) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[runId,f.id,p.workspaceId,p.userId,f.name,f.sha256,takeCharacters(f.extracted_text,6000),characters(f.extracted_text),Math.min(6000,characters(f.extracted_text))]);
  }
 }
}
export class ShareService {
 constructor(private db:Db){}
 async create(p:Principal,runId:string,ttlSeconds=86400){
  if(!Number.isInteger(ttlSeconds)||ttlSeconds<60||ttlSeconds>7*86400)fail('INVALID_SHARE_EXPIRY');
  return this.db.transaction(async tx=>{
   await scope(tx,p);const r=await tx.query('SELECT r.language,v.content FROM tool_runs r JOIN result_versions v ON v.run_id=r.id WHERE r.id=$1 AND r.workspace_id=$2 AND r.owner_id=$3 AND r.status=\'completed\' AND r.history_deleted_at IS NULL AND r.history_mode=\'cloud\' AND r.retention_until>now() ORDER BY v.version DESC LIMIT 1',[runId,p.workspaceId,p.userId]);
   if(!r.rowCount)fail('RESULT_NOT_SHAREABLE',409);
   const secret=token(),shareId=id(),expiresAt=iso(Date.now()+ttlSeconds*1000);
   await tx.query('INSERT INTO shares(id,workspace_id,owner_id,run_id,token_hash,expires_at) VALUES($1,$2,$3,$4,$5,$6)',[shareId,p.workspaceId,p.userId,runId,hash(secret),expiresAt]);
   await tx.query('INSERT INTO share_snapshots(share_id,result,language) VALUES($1,$2,$3)',[shareId,r.rows[0].content,r.rows[0].language]);
   await audit(tx,p,'share.created',shareId,'share');return {id:shareId,token:secret,expiresAt};
  });
 }
 async resolve(secret:string){
  if(!/^[A-Za-z0-9_-]{43}$/.test(secret))return fail('SHARE_NOT_FOUND',404);
  const r=await this.db.query('SELECT v.result,v.language,s.expires_at FROM shares s JOIN share_snapshots v ON v.share_id=s.id JOIN users u ON u.id=s.owner_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status=\'active\'',[hash(secret)]);
  if(!r.rowCount)fail('SHARE_NOT_FOUND',404);return r.rows[0];
 }
}
