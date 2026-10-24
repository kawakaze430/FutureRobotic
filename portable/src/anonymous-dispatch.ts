import {isIP} from 'node:net';
import {sign} from 'node:crypto';
import type {Db} from './db.js';
import {audit,fail,hash,id,iso,lock,token} from './common.js';
import {constantEqual,mac} from './crypto.js';
import {AuthLimits,boundedJson,type HumanVerifier} from './public-auth.js';
import {AnonymousAllowance} from './protection.js';
import {executionLanguages} from './execution.js';
import {toolInstruction} from './tool-instructions.js';
import {ProviderFailure,type Provider,type ProviderRequest} from './worker.js';
import {anonymousAiInput,anonymousExecutionInput,type AnonymousAiInput,type AnonymousExecutionInput} from './anonymous-contracts.js';

export interface AnonymousOptions {
 enabled:boolean;hashSecret:string;human?:HumanVerifier;aiEnabled:boolean;executionEnabled:boolean;
 /** Approved conservative ceiling, not a measured price or invoice. */
 maxAiMicroUsd:number;
}
interface Session {id:string;subject:string;expiresAt:string}
interface RequestRow {id:string;session_id:string;subject_hash:string;day:string;operation:'ai'|'execution';request_key:string;request_hash:string;payload:AnonymousAiInput|AnonymousExecutionInput;state:string;output:string;execution_result:unknown;error_code:string|null;created_at:string|Date;expires_at:string|Date}
const chars=(s:string)=>Array.from(s).length;

/** Separate action/host validation prevents reusing a login challenge for paid public dispatch. */
export class AnonymousTurnstileVerifier implements HumanVerifier {
 constructor(private secret:string,private host:string,private http:typeof fetch=fetch){}
 async verify(value:string,ip:string){
  if(!this.secret||!value||value.length>2048||!isIP(ip))return false;
  try{const r=await this.http('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:this.secret,response:value,remoteip:ip}),signal:AbortSignal.timeout(5000)});
   if(!r.ok)return false;const data=await boundedJson(r);return data.success===true&&data.hostname===this.host&&data.action==='anonymous_dispatch';
  }catch{return false;}
 }
}

/** Account-free, short-lived queue. No submitted code is executed on this service host. */
export class AnonymousDispatchService {
 constructor(private db:Db,private options:AnonymousOptions){
  if(options.hashSecret.length<32)throw Error('Anonymous hashing secret requires at least32characters');
  if(!Number.isSafeInteger(options.maxAiMicroUsd)||options.maxAiMicroUsd<1||options.maxAiMicroUsd>1000000)throw Error('Configure an approved bounded anonymous cost ceiling');
  if(options.enabled&&!options.human)throw Error('Anonymous dispatch requires human verification');
 }
 config(){return {enabled:this.options.enabled,ai:this.options.enabled&&this.options.aiEnabled,execution:this.options.enabled&&this.options.executionEnabled,contextLimit:4000 as const,executionLimit:10000 as const,dailyAiLimit:2 as const,dailyExecutionLimit:3 as const};}
 private enabled(operation?:'ai'|'execution'){
  if(!this.options.enabled||operation==='ai'&&!this.options.aiEnabled||operation==='execution'&&!this.options.executionEnabled)fail('ANONYMOUS_NOT_ENABLED',503);
 }
 private ip(ip:string){
  if(!isIP(ip))fail('TRUSTED_CLIENT_IP_REQUIRED',403);
  // Canonicalize equivalent IPv6 representations; IPv4-mapped forms share IPv4 quota.
  const normalized=ip.toLowerCase().startsWith('::ffff:')&&isIP(ip.slice(7))===4?ip.slice(7):isIP(ip)===6?new URL(`http://[${ip}]/`).hostname.slice(1,-1):ip;
  return normalized;
 }
 private subject(ip:string){return mac(this.options.hashSecret,this.ip(ip));}
 async session(ip:string,humanToken:string){
  this.enabled();ip=this.ip(ip);
  if(typeof humanToken!=='string'||!humanToken||humanToken.length>2048)fail('HUMAN_VERIFICATION_FAILED',403);
  await new AuthLimits(this.db,this.options.hashSecret).take(ip,'anonymous-session',5);
  if(!await this.options.human!.verify(humanToken,ip))fail('HUMAN_VERIFICATION_FAILED',403);
  const sessionToken=token(),csrfToken=token(),expiresAt=iso(Date.now()+3600000);
  await this.db.transaction(async tx=>{
   await tx.query('DELETE FROM bot_token_uses WHERE expires_at<=now()');
   const used=await tx.query('INSERT INTO bot_token_uses(token_hash,expires_at) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING token_hash',[hash(humanToken),iso(Date.now()+600000)]);
   if(!used.rowCount)fail('HUMAN_TOKEN_REPLAY',403);
   await tx.query('INSERT INTO anonymous_sessions(id,token_hash,csrf_hash,subject_hash,expires_at) VALUES($1,$2,$3,$4,$5)',[id(),hash(sessionToken),hash(csrfToken),this.subject(ip),expiresAt]);
  });
  return {sessionToken,csrfToken,expiresAt};
 }
 private async authenticate(db:Db,sessionToken:string,ip:string,csrfToken?:string):Promise<Session>{
  if(typeof sessionToken!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(sessionToken))fail('ANONYMOUS_SESSION_REQUIRED',401);
  const row=(await db.query('SELECT id,subject_hash,csrf_hash,expires_at FROM anonymous_sessions WHERE token_hash=$1 AND expires_at>now()',[hash(sessionToken)])).rows[0];
  if(!row||!constantEqual(row.subject_hash,this.subject(ip)))fail('ANONYMOUS_SESSION_REQUIRED',401);
  if(csrfToken!==undefined&&(!csrfToken||csrfToken.length>100||!constantEqual(row.csrf_hash,hash(csrfToken))))fail('CSRF_TOKEN',403);
  return {id:row.id,subject:row.subject_hash,expiresAt:new Date(row.expires_at).toISOString()};
 }
 private validated(operation:'ai'|'execution',value:unknown){
  if(operation==='ai'){
   const parsed=anonymousAiInput.safeParse(value);if(!parsed.success)fail('INVALID_ANONYMOUS_INPUT');
   const input=parsed.data;if(!input.source.trim()||!input.language.trim()||chars(input.source)+chars(input.instructions??'')>4000)fail('ANONYMOUS_CONTEXT_LIMIT');
   if(input.tool==='convert'&&(!input.targetLanguage?.trim()||input.targetLanguage===input.language))fail('INVALID_ANONYMOUS_INPUT');
   return {tool:input.tool,source:input.source,language:input.language,targetLanguage:input.targetLanguage??input.language,instructions:input.instructions??''};
  }
  const parsed=anonymousExecutionInput.safeParse(value);if(!parsed.success)fail('EXECUTION_INPUT_LIMIT');
  if(!parsed.data.source.trim()||chars(parsed.data.source)>10000||Buffer.byteLength(parsed.data.source)>40000)fail('EXECUTION_INPUT_LIMIT');
  return parsed.data;
 }
 async create(sessionToken:string,ip:string,csrfToken:string,operation:'ai'|'execution',value:unknown,key:string,trace:string){
  this.enabled(operation);if(!/^[A-Za-z0-9_-]{8,100}$/.test(key))fail('INVALID_IDEMPOTENCY_KEY');
  const payload=this.validated(operation,value);await new AuthLimits(this.db,this.options.hashSecret).take(this.ip(ip),'anonymous-'+operation+'-create',30,60);const fingerprint=hash(JSON.stringify({operation,payload})),day=new Date().toISOString().slice(0,10),normalizedIp=this.ip(ip);
  return this.db.transaction(async tx=>{
   const session=await this.authenticate(tx,sessionToken,normalizedIp,csrfToken);
   await lock(tx,`anonymous:${session.subject}:${day}:${operation}`);
   const previous=(await tx.query('SELECT id,state,request_hash,session_id FROM anonymous_requests WHERE subject_hash=$1 AND day=$2 AND operation=$3 AND request_key=$4',[session.subject,day,operation,key])).rows[0];
   if(previous){if(previous.request_hash!==fingerprint||previous.session_id!==session.id)fail('IDEMPOTENCY_CONFLICT',409);return {id:previous.id as string,state:previous.state as string,replayed:true};}
   await lock(tx,'anonymous-backlog');
   const backlog=(await tx.query("SELECT count(*)::int AS total,count(*) FILTER(WHERE subject_hash=$1)::int AS own FROM anonymous_requests WHERE state IN('queued','dispatching')",[session.subject])).rows[0];
   if(backlog.total>=50||backlog.own>=2)fail('ANONYMOUS_BACKLOG_FULL',429);
   const control=(await tx.query('SELECT provider_enabled,runner_enabled,daily_budget_micro_usd FROM runtime_controls WHERE id=1')).rows[0];
   if(operation==='ai'&&!control.provider_enabled)fail('PROVIDER_EMERGENCY_STOP',503);
   if(operation==='execution'&&!control.runner_enabled)fail('RUNNER_EMERGENCY_STOP',503);
   // This is the same pseudonymous subject/key/transaction as the durable daily counter.
   await new AnonymousAllowance(tx,this.options.hashSecret).reserve(normalizedIp,operation,key);
   const requestId=id();await tx.query('INSERT INTO anonymous_requests(id,session_id,subject_hash,day,operation,request_key,request_hash,payload,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[requestId,session.id,session.subject,day,operation,key,fingerprint,JSON.stringify(payload),session.expiresAt]);
   if(operation==='ai')await this.reserveSpend(tx,requestId,day);
   await audit(tx,null,'anonymous.request_queued',requestId,trace,{operation});
   return {id:requestId,state:'queued',replayed:false};
  });
 }
 async get(sessionToken:string,ip:string,requestId:string){
  const session=await this.authenticate(this.db,sessionToken,ip);
  const row=(await this.db.query<RequestRow>('SELECT * FROM anonymous_requests WHERE id=$1 AND session_id=$2 AND subject_hash=$3 AND expires_at>now()',[requestId,session.id,session.subject])).rows[0];
  if(!row)fail('NOT_FOUND',404);
  return {id:row.id,operation:row.operation,state:row.state,output:row.output,executionResult:row.execution_result??null,errorCode:row.error_code,createdAt:new Date(row.created_at).toISOString(),expiresAt:new Date(row.expires_at).toISOString()};
 }
 async recover(sessionToken:string,ip:string,key:string,operation:'ai'|'execution'){
  if(!/^[A-Za-z0-9_-]{8,100}$/.test(key)||!['ai','execution'].includes(operation))fail('INVALID_IDEMPOTENCY_KEY');
  const session=await this.authenticate(this.db,sessionToken,ip);
  const row=(await this.db.query('SELECT id FROM anonymous_requests WHERE session_id=$1 AND subject_hash=$2 AND request_key=$3 AND operation=$4 AND expires_at>now() ORDER BY created_at DESC LIMIT 1',[session.id,session.subject,key,operation])).rows[0];
  return row?this.get(sessionToken,ip,row.id):null;
 }
 async cancel(sessionToken:string,ip:string,csrfToken:string,requestId:string){
  return this.db.transaction(async tx=>{
   const session=await this.authenticate(tx,sessionToken,ip,csrfToken);
   const row=(await tx.query<RequestRow>('SELECT * FROM anonymous_requests WHERE id=$1 AND session_id=$2 AND subject_hash=$3 AND expires_at>now() FOR UPDATE',[requestId,session.id,session.subject])).rows[0];if(!row)fail('NOT_FOUND',404);
   if(row.state==='queued'){await tx.query("UPDATE anonymous_requests SET state='cancelled',payload='{}',updated_at=now() WHERE id=$1",[row.id]);await this.finalizeSpend(tx,row.id,false);await this.usage(tx,row,'released');return {id:row.id,state:'cancelled'};}
   // Once fenced, cancellation cannot establish whether the remote operation ran.
   if(row.state==='dispatching')fail('ANONYMOUS_OUTCOME_UNCERTAIN',409);
   return {id:row.id,state:row.state};
  });
 }
 private async reserveSpend(tx:Db,requestId:string,day:string){
  await lock(tx,'provider-spending');const control=(await tx.query('SELECT * FROM runtime_controls WHERE id=1 FOR UPDATE')).rows[0];if(!control.provider_enabled)fail('PROVIDER_EMERGENCY_STOP',503);
  await tx.query('INSERT INTO spend_days(day) VALUES($1) ON CONFLICT DO NOTHING',[day]);const current=(await tx.query('SELECT * FROM spend_days WHERE day=$1 FOR UPDATE',[day])).rows[0],amount=this.options.maxAiMicroUsd;
  if(Number(current.held_micro_usd)+Number(current.spent_micro_usd)+amount>Number(control.daily_budget_micro_usd))fail('DAILY_SPENDING_LIMIT',429);
  await tx.query('UPDATE spend_days SET held_micro_usd=held_micro_usd+$2 WHERE day=$1',[day,amount]);await tx.query('INSERT INTO anonymous_spend_holds(request_id,day,micro_usd) VALUES($1,$2,$3)',[requestId,day,amount]);
 }
 private async finalizeSpend(tx:Db,requestId:string,spent:boolean){
  const row=(await tx.query('SELECT * FROM anonymous_spend_holds WHERE request_id=$1 FOR UPDATE',[requestId])).rows[0];if(!row||row.status!=='held')return;
  await tx.query('UPDATE spend_days SET held_micro_usd=held_micro_usd-$2,spent_micro_usd=spent_micro_usd+$3 WHERE day=$1',[row.day,row.micro_usd,spent?row.micro_usd:0]);await tx.query('UPDATE anonymous_spend_holds SET status=$2 WHERE request_id=$1',[requestId,spent?'spent':'released']);
 }
 private async usage(tx:Db,row:RequestRow,state:'completed'|'uncertain'|'released'){
  await tx.query('UPDATE anonymous_usage SET state=$5 WHERE subject_hash=$1 AND day=$2 AND operation=$3 AND operation_key=$4',[row.subject_hash,row.day,row.operation,row.request_key,state]);
 }
 private async claim(operation:'ai'|'execution'){
  this.enabled(operation);
  return this.db.transaction(async tx=>{
   // A crashed fenced dispatch is reconciled, never put back on the queue.
   const stale=await tx.query<RequestRow>("UPDATE anonymous_requests SET state='uncertain',payload='{}',error_code='DISPATCH_OUTCOME_UNKNOWN',updated_at=now() WHERE state='dispatching' AND lease_until<=now() RETURNING *");
   for(const row of stale.rows)await this.usage(tx,row,'uncertain');
   const control=(await tx.query('SELECT provider_enabled,runner_enabled FROM runtime_controls WHERE id=1')).rows[0];if(operation==='ai'?!control.provider_enabled:!control.runner_enabled)return null;
   const row=(await tx.query<RequestRow>("SELECT * FROM anonymous_requests WHERE operation=$1 AND state='queued' AND expires_at>now() ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 1",[operation])).rows[0];if(!row)return null;
   await tx.query("UPDATE anonymous_requests SET state='dispatching',lease_until=$2,updated_at=now() WHERE id=$1",[row.id,iso(Date.now()+45000)]);return row;
  });
 }
 private async finish(row:RequestRow,state:'completed'|'failed'|'uncertain',output:string,result:unknown,errorCode:string|null,spent:boolean|null){
  await this.db.transaction(async tx=>{
   const held=(await tx.query('SELECT state FROM anonymous_requests WHERE id=$1 FOR UPDATE',[row.id])).rows[0];if(held?.state!=='dispatching')return;
   await tx.query('UPDATE anonymous_requests SET state=$2,output=$3,execution_result=$4,error_code=$5,payload=\'{}\',lease_until=NULL,updated_at=now() WHERE id=$1',[row.id,state,output,JSON.stringify(result),errorCode]);
   if(spent!==null)await this.finalizeSpend(tx,row.id,spent);
   await this.usage(tx,row,state==='uncertain'?'uncertain':state==='failed'&&spent===false?'released':'completed');
  });
 }
 async dispatchAi(provider:Provider|null){
  if(!provider)return false;const row=await this.claim('ai');if(!row)return false;
  const input=row.payload as AnonymousAiInput;let partial='';const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{
   const request:ProviderRequest={runId:row.id,traceId:hash(row.id).slice(0,32),idempotencyKey:row.id,modelId:'standard-auto',tools:[],signal:controller.signal,messages:[{role:'system',content:toolInstruction(input.tool)},{role:'user',content:JSON.stringify({source:input.source,language:input.language,targetLanguage:input.targetLanguage,instructions:input.instructions})}],onDelta:async delta=>{partial+=delta;if(partial.length>200000)throw new ProviderFailure('unknown');}};
   // An approved admission ceiling must cover this exact bounded provider request.
   if(provider.estimateMicroUsd&&provider.estimateMicroUsd(request)>this.options.maxAiMicroUsd)throw new ProviderFailure('not_sent');
   const result=await Promise.race([provider.generate(request),new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(new ProviderFailure('unknown')),{once:true}))]);
   if(typeof result!=='string'||result.length>200000)throw new ProviderFailure('unknown');
   await this.finish(row,'completed',result,null,null,true);
  }catch(error){const safe=error instanceof ProviderFailure&&['not_sent','rejected'].includes(error.outcome);await this.finish(row,partial?'failed':safe?'failed':'uncertain',partial,null,partial?'PROVIDER_REPLY_PARTIAL':safe?'PROVIDER_REJECTED':'DISPATCH_OUTCOME_UNKNOWN',partial?true:safe?false:null);}
  finally{clearTimeout(timer);}
  return true;
 }
 async dispatchExecution(endpoint:string,privateKey:string,http:typeof fetch=fetch){
  const url=new URL(endpoint);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!privateKey)fail('PRIVATE_RUNNER_TLS_REQUIRED',503);
  const row=await this.claim('execution');if(!row)return false;const input=row.payload as AnonymousExecutionInput;
  if(!executionLanguages.includes(input.language))fail('EXECUTION_INPUT_LIMIT');
  const claims=Buffer.from(JSON.stringify({aud:'fr-isolated-runner',id:row.id,sha256:hash(input.source),stdinSha256:hash(''),language:input.language,expiresAt:Date.now()+60000,nonce:id()})).toString('base64url');
  // Capability signing only; submitted source is sent solely to the approved HTTPS gateway.
  let capability:string;try{capability=claims+'.'+sign(null,Buffer.from(claims),privateKey).toString('base64url');}catch{await this.finish(row,'failed','',null,'RUNNER_NOT_SENT',false);return true;}
  try{
   const response=await http(endpoint,{method:'POST',headers:{'content-type':'application/json','x-job-capability':capability},body:JSON.stringify({id:row.id,language:input.language,source:input.source,stdin:''}),signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('RUNNER_RESPONSE_UNKNOWN');const result=await boundedJson(response,150000);
   if(typeof result.stdout!=='string'||typeof result.stderr!=='string'||Buffer.byteLength(result.stdout)+Buffer.byteLength(result.stderr)>131072||!Number.isInteger(result.exitCode)||!Number.isFinite(result.durationMs)||result.durationMs<0||result.durationMs>12000||typeof result.truncated!=='boolean'||typeof result.timedOut!=='boolean'||!['compile','execute','validation'].includes(result.phase))throw Error('RUNNER_INVALID_RESULT');
   await this.finish(row,'completed','',{stdout:result.stdout,stderr:result.stderr,exitCode:result.exitCode,durationMs:result.durationMs,truncated:result.truncated,timedOut:result.timedOut,phase:result.phase,status:result.timedOut?'timeout':result.truncated?'output_limit':result.exitCode===0?'success':result.phase==='compile'?'compile_error':'runtime_error'},null,true);
  }catch{await this.finish(row,'uncertain','',null,'RUNNER_OUTCOME_UNKNOWN',null);}
  return true;
 }
 async cleanup(){
  await this.db.transaction(async tx=>{
   const expired=await tx.query<RequestRow>("SELECT * FROM anonymous_requests WHERE expires_at<=now() AND (state='queued' OR output<>'' OR execution_result IS NOT NULL OR payload<>'{}'::jsonb) FOR UPDATE");
   for(const row of expired.rows){if(row.state==='queued'){await this.finalizeSpend(tx,row.id,false);await this.usage(tx,row,'released');}await tx.query("UPDATE anonymous_requests SET state=CASE WHEN state='queued' THEN 'cancelled' ELSE state END,payload='{}',output='',execution_result=NULL,updated_at=now() WHERE id=$1",[row.id]);}
   // Request/accounting metadata is retained for reconciliation. Source/output are
   // expired above; do not delete referenced financial evidence or unknown holds.
   await tx.query("DELETE FROM anonymous_usage WHERE day<current_date-7 AND state<>'uncertain'");
  });
 }
}
