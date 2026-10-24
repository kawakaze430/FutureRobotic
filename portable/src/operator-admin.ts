import type {Db} from './db.js';
import {audit,fail,hash,id,iso,lock,nextCursor,pageCursor,scope,type Principal} from './common.js';
import {Sealer} from './crypto.js';
import {OperatorService} from './protection.js';
import {enqueue} from './jobs.js';

export const operatorRoles=['support','billing','operations','administrator'] as const;
export type OperatorRole=typeof operatorRoles[number];
export const operatorPermissions={
 support:['support.read','support.close'],
 billing:['billing.read','billing.reconcile'],
 operations:['controls.read','controls.write'],
 administrator:['support.read','support.close','billing.read','billing.reconcile','controls.read','controls.write','audit.read'],
} as const;
type Management={action:'enroll'|'rotate'|'revoke';userId:string;role?:OperatorRole;secretBase64?:string;expectedVersion?:number;requestKey:string;reason:string};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const requestKey=(key:string)=>{if(!/^[A-Za-z0-9_-]{8,100}$/.test(key))fail('INVALID_IDEMPOTENCY_KEY');};
const reasonValue=(reason:string)=>{if(typeof reason!=='string'||reason.trim().length<10||reason.length>240||/[\u0000-\u001f]/.test(reason))fail('OPERATOR_REASON_REQUIRED');return reason.trim();};

/** Protected host/CLI service only: never register this as a web endpoint. */
export class OperatorAdminService {
 constructor(private db:Db,private sealer:Sealer){}
 async manage(value:Management){
  requestKey(value.requestKey);const reason=reasonValue(value.reason);
  if(!uuid.test(value.userId)||!['enroll','rotate','revoke'].includes(value.action))fail('INVALID_OPERATOR_MANAGEMENT');
  if(value.action!=='revoke'&&!operatorRoles.includes(value.role!))fail('INVALID_OPERATOR_ROLE');
  if(value.action!=='enroll'&&(!Number.isSafeInteger(value.expectedVersion)||value.expectedVersion!<1))fail('OPERATOR_VERSION_REQUIRED');
  let seed:Buffer|undefined;
  if(value.action!=='revoke'){
   if(typeof value.secretBase64!=='string'||! /^[A-Za-z0-9+/]+={0,2}$/.test(value.secretBase64))fail('INVALID_OPERATOR_SECRET');
   seed=Buffer.from(value.secretBase64,'base64');
   if(seed.length<20||seed.length>64||seed.toString('base64')!==value.secretBase64)fail('INVALID_OPERATOR_SECRET');
  }
  const fingerprint=hash(JSON.stringify({action:value.action,userId:value.userId,role:value.role??null,secretHash:seed?hash(seed.toString('base64')):null,expectedVersion:value.expectedVersion??null,reason}));
  return this.db.transaction(async tx=>{
   // Column-only last_step UPDATE granted to the app does not satisfy this check.
   const capabilities=(await tx.query("SELECT current_user AS role,has_table_privilege(current_user,'operators','INSERT') AS can_insert,has_table_privilege(current_user,'operators','UPDATE') AS can_update")).rows[0];
   if(capabilities.role==='fr_runtime'||!capabilities.can_insert||!capabilities.can_update)fail('PROTECTED_OPERATOR_ADMIN_REQUIRED',403);
   await lock(tx,'operator-admin:'+value.userId);await lock(tx,'operator-admin-key:'+value.requestKey);
   const previous=(await tx.query('SELECT user_id,role,version,enabled,request_hash FROM operator_admin_events WHERE request_key=$1',[value.requestKey])).rows[0];
   if(previous){if(previous.request_hash!==fingerprint)fail('IDEMPOTENCY_CONFLICT',409);return {userId:previous.user_id as string,role:previous.role as OperatorRole,version:previous.version as number,enabled:previous.enabled as boolean,replayed:true};}
   const user=(await tx.query("SELECT u.id FROM users u WHERE u.id=$1 AND u.status='active' FOR UPDATE",[value.userId])).rows[0];if(!user)fail('NOT_FOUND',404);
   const current=(await tx.query('SELECT role,version,totp_cipher,enabled FROM operators WHERE user_id=$1 FOR UPDATE',[value.userId])).rows[0];
   if(value.action==='enroll'&&current)fail('OPERATOR_ALREADY_ENROLLED',409);
   if(value.action!=='enroll'&&(!current||current.version!==value.expectedVersion))fail('VERSION_CONFLICT',409);
   if(value.action==='rotate'&&this.sealer.open(current!.totp_cipher)===seed!.toString('base64'))fail('OPERATOR_SECRET_REUSED',409);
   const version=(current?.version??0)+1,role=value.action==='revoke'?current!.role:value.role!,enabled=value.action!=='revoke';
   if(value.action==='enroll')await tx.query('INSERT INTO operators(user_id,role,totp_cipher,enabled,version) VALUES($1,$2,$3,true,$4)',[value.userId,role,this.sealer.seal(seed!.toString('base64')),version]);
   else if(value.action==='rotate')await tx.query('UPDATE operators SET role=$2,totp_cipher=$3,enabled=true,last_step=-1,version=$4,updated_at=now() WHERE user_id=$1',[value.userId,role,this.sealer.seal(seed!.toString('base64')),version]);
   else await tx.query('UPDATE operators SET enabled=false,version=$2,updated_at=now() WHERE user_id=$1',[value.userId,version]);
   await tx.query('DELETE FROM operator_sessions WHERE user_id=$1',[value.userId]);
   // Invalidate existing application sessions so another device cannot retain authority.
   await tx.query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL',[value.userId]);
   await tx.query('INSERT INTO operator_admin_events(id,request_key,user_id,action,role,version,enabled,request_hash,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id(),value.requestKey,value.userId,value.action,role,version,enabled,fingerprint,reason]);
   await audit(tx,null,'operator.'+value.action,value.userId,'protected-operator-cli',{role,version,reason});
   return {userId:value.userId,role:role as OperatorRole,version,enabled,replayed:false};
  });
 }
}

export class OperatorConsoleService {
 constructor(private db:Db,private sealer:Sealer){}
 async unlock(p:Principal,code:string){
  await scope(this.db,p);
  const hits=await this.db.transaction(async tx=>{
   await lock(tx,'operator-mfa-rate:'+p.userId);const window=iso(Math.floor(Date.now()/300000)*300000);
   return (await tx.query("INSERT INTO auth_windows(subject_hash,operation,window_start) VALUES($1,'operator_mfa',$2) ON CONFLICT(subject_hash,operation,window_start) DO UPDATE SET hits=auth_windows.hits+1 RETURNING hits",[hash('operator:'+p.userId),window])).rows[0].hits;
  });
  if(hits>5)fail('OPERATOR_MFA_RATE_LIMIT',429);
  return this.db.transaction(async tx=>{
   const role=(await tx.query('SELECT role FROM operators WHERE user_id=$1',[p.userId])).rows[0]?.role as OperatorRole|undefined;
   if(!role||!operatorRoles.includes(role))fail('OPERATOR_FORBIDDEN',403);
   const session=(await tx.query('SELECT id FROM sessions WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL AND expires_at>now()',[p.sessionId,p.userId])).rows[0];if(!session)fail('UNAUTHENTICATED',401);
   const permission=operatorPermissions[role][0];await new OperatorService(tx,this.sealer).authorize(p,permission,code);
   const version=(await tx.query('SELECT version FROM operators WHERE user_id=$1',[p.userId])).rows[0].version;
   const verified=Date.now(),expiresAt=iso(verified+300000);
   await tx.query('INSERT INTO operator_sessions(session_id,user_id,operator_version,verified_at,expires_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT(session_id) DO UPDATE SET user_id=excluded.user_id,operator_version=excluded.operator_version,verified_at=excluded.verified_at,expires_at=excluded.expires_at',[p.sessionId,p.userId,version,iso(verified),expiresAt]);
   await audit(tx,p,'operator.session_verified',p.sessionId,'operator-console',{role});
   return {role,permissions:[...operatorPermissions[role]],expiresAt};
  });
 }
 async authorizeSession(tx:Db,p:Principal,permission?:string){
  await scope(tx,p);
  const grant=(await tx.query('SELECT o.role,g.expires_at FROM operator_sessions g JOIN operators o ON o.user_id=g.user_id JOIN sessions s ON s.id=g.session_id WHERE g.session_id=$1 AND g.user_id=$2 AND g.operator_version=o.version AND o.enabled=true AND s.user_id=$2 AND s.revoked_at IS NULL AND s.expires_at>now() AND g.expires_at>now() AND g.verified_at<=now()',[p.sessionId,p.userId])).rows[0];
  const role=grant?.role as OperatorRole;
  if(!grant||!operatorRoles.includes(role))fail('OPERATOR_MFA_REQUIRED',403);
  const permissions=operatorPermissions[role] as readonly string[];
  if(permission&&!permissions.includes(permission))fail('OPERATOR_FORBIDDEN',403);
  return {role,permissions:[...permissions],expiresAt:new Date(grant.expires_at).toISOString()};
 }
 async session(p:Principal){return this.authorizeSession(this.db,p);}
 async close(p:Principal){await this.db.query('DELETE FROM operator_sessions WHERE session_id=$1 AND user_id=$2',[p.sessionId,p.userId]);return {locked:true as const};}
 async tickets(p:Principal,cursor?:string){
  await this.authorizeSession(this.db,p,'support.read');const c=pageCursor(cursor);
  const rows=(await this.db.query("SELECT id,subject,message,status,created_at FROM support_tickets WHERE ($1::timestamptz IS NULL OR (created_at,id)<($1::timestamptz,$2::uuid)) ORDER BY created_at DESC,id DESC LIMIT 50",[c?.at??null,c?.id??null])).rows;
  return {items:rows,nextCursor:nextCursor(rows,50)};
 }
 async billing(p:Principal,cursor?:string){
  await this.authorizeSession(this.db,p,'billing.read');const c=pageCursor(cursor);
  const rows=(await this.db.query('SELECT id,workspace_id,owner_id,plan_id,status,period_start,period_end,last_event_at AS created_at FROM subscriptions WHERE ($1::timestamptz IS NULL OR (last_event_at,id)<($1::timestamptz,$2::uuid)) ORDER BY last_event_at DESC,id DESC LIMIT 50',[c?.at??null,c?.id??null])).rows;
  return {items:rows,nextCursor:nextCursor(rows,50)};
 }
 async controls(p:Principal){await this.authorizeSession(this.db,p,'controls.read');return new OperatorService(this.db,this.sealer).controls(p);}
 async events(p:Principal,cursor?:string){
  await this.authorizeSession(this.db,p,'audit.read');const c=pageCursor(cursor);
  const rows=(await this.db.query("SELECT id,actor_id,action,resource_id,trace_id,created_at FROM audit_events WHERE action LIKE 'operator.%' AND ($1::timestamptz IS NULL OR (created_at,id)<($1::timestamptz,$2::uuid)) ORDER BY created_at DESC,id DESC LIMIT 50",[c?.at??null,c?.id??null])).rows;
  return {items:rows,nextCursor:nextCursor(rows,50)};
 }
 private async action<T extends object>(p:Principal,permission:string,action:'support.status'|'controls.update'|'billing.reconcile',resource:string,body:unknown,key:string,work:(tx:Db)=>Promise<T>){
  requestKey(key);const fingerprint=hash(JSON.stringify({action,resource,body}));
  return this.db.transaction(async tx=>{
   await this.authorizeSession(tx,p,permission);await lock(tx,`operator-action:${p.userId}:${key}`);
   const receipt=(await tx.query('SELECT request_hash,result FROM operator_action_receipts WHERE actor_id=$1 AND request_key=$2',[p.userId,key])).rows[0];
   if(receipt){if(receipt.request_hash!==fingerprint)fail('IDEMPOTENCY_CONFLICT',409);return {...receipt.result,replayed:true} as T&{replayed:boolean};}
   const result=await work(tx);await tx.query('INSERT INTO operator_action_receipts(id,actor_id,request_key,action,resource_id,request_hash,result) VALUES($1,$2,$3,$4,$5,$6,$7)',[id(),p.userId,key,action,resource,fingerprint,JSON.stringify(result)]);
   return {...result,replayed:false};
  });
 }
 async ticketStatus(p:Principal,ticketId:string,status:'open'|'closed',reason:string,key:string){
  const safeReason=reasonValue(reason);if(!uuid.test(ticketId)||!['open','closed'].includes(status))fail('INVALID_SUPPORT_ACTION');
  return this.action(p,'support.close','support.status',ticketId,{status,reason:safeReason},key,async tx=>{
   const r=await tx.query('UPDATE support_tickets SET status=$2 WHERE id=$1 RETURNING id,status',[ticketId,status]);if(!r.rowCount)fail('NOT_FOUND',404);
   await audit(tx,p,'operator.support_status',ticketId,'operator-console',{status,reason:safeReason});return {id:ticketId,status};
  });
 }
 async updateControls(p:Principal,value:{providerEnabled:boolean;runnerEnabled:boolean;dailyBudgetMicroUsd:number;reason:string},key:string){
  const reason=reasonValue(value.reason);const patch={providerEnabled:value.providerEnabled,runnerEnabled:value.runnerEnabled,dailyBudgetMicroUsd:value.dailyBudgetMicroUsd};
  if(typeof patch.providerEnabled!=='boolean'||typeof patch.runnerEnabled!=='boolean')fail('INVALID_CONTROL_ACTION');
  return this.action(p,'controls.write','controls.update','runtime-controls',{...patch,reason},key,async tx=>{
   await new OperatorService(tx,this.sealer).controls(p,patch);await audit(tx,p,'operator.control_reason','runtime-controls','operator-console',{reason});return {updated:true as const};
  });
 }
 async requestReconciliation(p:Principal,reason:string,key:string){
  const safeReason=reasonValue(reason);
  return this.action(p,'billing.reconcile','billing.reconcile','finance-reconcile',{reason:safeReason},key,async tx=>{
   const jobId=await enqueue(tx,'reconcile',`operator-reconcile:${p.userId}:${key}`,{},'operator-console');await audit(tx,p,'operator.reconciliation_requested',jobId,'operator-console',{reason:safeReason});return {jobId};
  });
 }
}
