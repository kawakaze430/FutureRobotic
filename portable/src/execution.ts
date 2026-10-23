import {sign} from 'node:crypto';
import type {Db} from './db.js';
import {audit,fail,hash,id,iso,lock,scope,type Principal} from './common.js';
import {AnonymousAllowance} from './protection.js';
import {boundedJson} from './public-auth.js';
export const executionLanguages=['Python','JavaScript','C','C++','Java'];
export class ExecutionService {
 constructor(private db:Db,private hashSecret:string){}
 async create(p:Principal,language:string,source:string,key:string){
  if(!executionLanguages.includes(language)||Array.from(source).length>10000||Buffer.byteLength(source)>40000||!source.trim()||!/^[A-Za-z0-9_-]{8,100}$/.test(key))fail('EXECUTION_INPUT_LIMIT');
  return this.db.transaction(async tx=>{
   await scope(tx,p);await lock(tx,`execution:${p.workspaceId}:${key}`);
   const prior=await tx.query('SELECT id,state,source_hash,language FROM execution_jobs WHERE workspace_id=$1 AND owner_id=$2 AND request_key=$3',[p.workspaceId,p.userId,key]);
   if(prior.rowCount){if(prior.rows[0].source_hash!==hash(source)||prior.rows[0].language!==language)fail('IDEMPOTENCY_CONFLICT',409);return prior.rows[0];}
   await lock(tx,'execution-backlog');
   const queue=await tx.query("SELECT count(*)::int AS total,count(*) FILTER(WHERE workspace_id=$1)::int AS owned FROM execution_jobs WHERE state IN('queued','running')",[p.workspaceId]);
   if(queue.rows[0].total>=100||queue.rows[0].owned>=2)fail('RUNNER_BACKLOG_FULL',429);
   if(!(await tx.query('SELECT runner_enabled FROM runtime_controls WHERE id=1')).rows[0].runner_enabled)fail('RUNNER_EMERGENCY_STOP',503);
   await new AnonymousAllowance(tx,this.hashSecret).reserve(`account:${p.userId}`,'execution',key);
   const jobId=id();await tx.query('INSERT INTO execution_jobs(id,workspace_id,owner_id,request_key,language,source,source_hash) VALUES($1,$2,$3,$4,$5,$6,$7)',[jobId,p.workspaceId,p.userId,key,language,source,hash(source)]);
   await tx.query('INSERT INTO execution_admission(workspace_id) VALUES($1) ON CONFLICT DO NOTHING',[p.workspaceId]);await audit(tx,p,'execution.queued',jobId,'execution',{language});return {id:jobId,state:'queued'};
  });
 }
 async get(p:Principal,jobId:string){await scope(this.db,p);const r=await this.db.query('SELECT id,language,state,result,created_at FROM execution_jobs WHERE id=$1 AND workspace_id=$2 AND owner_id=$3',[jobId,p.workspaceId,p.userId]);if(!r.rowCount)fail('NOT_FOUND',404);return r.rows[0];}
 async claim(){
  return this.db.transaction(async tx=>{
   await tx.query('UPDATE execution_jobs SET state=\'uncertain\' WHERE state=\'running\' AND lease_until<now()');
   const lane=await tx.query('SELECT a.workspace_id FROM execution_admission a WHERE EXISTS(SELECT 1 FROM execution_jobs j WHERE j.workspace_id=a.workspace_id AND j.state=\'queued\') AND NOT EXISTS(SELECT 1 FROM execution_jobs j WHERE j.workspace_id=a.workspace_id AND j.state=\'running\') ORDER BY a.last_admitted_at,a.workspace_id FOR UPDATE SKIP LOCKED LIMIT 1');
   if(!lane.rowCount)return null;
   const job=(await tx.query('SELECT * FROM execution_jobs WHERE workspace_id=$1 AND state=\'queued\' ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 1',[lane.rows[0].workspace_id])).rows[0];if(!job)return null;
   await tx.query('UPDATE execution_jobs SET state=\'running\',lease_until=$2 WHERE id=$1',[job.id,iso(Date.now()+30000)]);await tx.query('UPDATE execution_admission SET last_admitted_at=now() WHERE workspace_id=$1',[job.workspace_id]);return job;
  });
 }
 async dispatch(endpoint:string,privateKey:string,http:typeof fetch=fetch){
  const url=new URL(endpoint);if(url.protocol!=='https:'||url.username||url.password||url.search)fail('PRIVATE_RUNNER_TLS_REQUIRED',503);
  const job=await this.claim();if(!job)return false;
  const payload={id:job.id,language:job.language,source:job.source,stdin:''};
  const claims=Buffer.from(JSON.stringify({aud:'fr-isolated-runner',id:job.id,sha256:hash(job.source),stdinSha256:hash(''),language:job.language,expiresAt:Date.now()+60000,nonce:id()})).toString('base64url');
  const capability=claims+'.'+sign(null,Buffer.from(claims),privateKey).toString('base64url');
  try{
   const response=await http(endpoint,{method:'POST',headers:{'content-type':'application/json','x-job-capability':capability},body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw new Error('RUNNER_RESPONSE_UNKNOWN');const result=await boundedJson(response,150000);
   if(typeof result.stdout!=='string'||typeof result.stderr!=='string'||Buffer.byteLength(result.stdout)+Buffer.byteLength(result.stderr)>131072||!Number.isInteger(result.exitCode)||!Number.isFinite(result.durationMs)||result.durationMs<0||result.durationMs>12000||typeof result.truncated!=='boolean'||typeof result.timedOut!=='boolean'||!['compile','execute','validation'].includes(result.phase))throw new Error('RUNNER_INVALID_RESULT');
   await this.db.query('UPDATE execution_jobs SET state=\'completed\',result=$2 WHERE id=$1 AND state=\'running\'',[job.id,JSON.stringify({...result,status:result.timedOut?'timeout':result.truncated?'output_limit':result.exitCode===0?'success':result.phase==='compile'?'compile_error':'runtime_error'})]);
  }catch{await this.db.query('UPDATE execution_jobs SET state=\'uncertain\' WHERE id=$1 AND state=\'running\'',[job.id]);}
  return true;
 }
}
