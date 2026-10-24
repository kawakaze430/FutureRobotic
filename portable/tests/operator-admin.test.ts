import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {migrate} from '../src/migrate.js';
import type {Db} from '../src/db.js';
import {Sealer,totp} from '../src/crypto.js';
import {OperatorAdminService,OperatorConsoleService,type OperatorRole} from '../src/operator-admin.js';
import {AppError,id} from '../src/common.js';
import {account,authHeaders,LocalObjects,silent,testDatabase} from './support.js';
import {buildApi} from '../src/api.js';
let root:string,db:Db,dispose:()=>Promise<void>;
const sealer=new Sealer(Buffer.alloc(32,9).toString('base64')),seed=Buffer.from('12345678901234567890'),reason='Reviewed protected enrollment fixture';
const isCode=(code:string)=>(e:unknown)=>e instanceof AppError&&e.code===code;
before(async()=>{root=await mkdtemp(join(tmpdir(),'fr-operators-'));const d=await testDatabase(join(root,'db'));db=d.db;dispose=d.dispose;await migrate(db);});
after(async()=>{await db.close();await dispose();await rm(root,{recursive:true,force:true});});
async function operator(role:OperatorRole){const a=await account(db);await new OperatorAdminService(db,sealer).manage({action:'enroll',userId:a.p.userId,role,secretBase64:seed.toString('base64'),requestKey:id(),reason});const session=await a.identity.createSession(a.p.userId);return {...a,session,p:{...a.p,sessionId:session.sessionId}};}
test('AUT-009 protected enrollment revokes sessions, is one-time/idempotent and appends immutable audit',async()=>{
 const a=await account(db),service=new OperatorAdminService(db,sealer),request={action:'enroll' as const,userId:a.p.userId,role:'support' as const,secretBase64:seed.toString('base64'),requestKey:id(),reason};
 const result=await service.manage(request);assert.equal(result.version,1);assert.equal(result.enabled,true);
 await assert.rejects(a.identity.authenticate(a.session.sessionToken),isCode('UNAUTHENTICATED'));
 assert.equal((await service.manage(request)).replayed,true);await assert.rejects(service.manage({...request,role:'billing'}),isCode('IDEMPOTENCY_CONFLICT'));
 await assert.rejects(service.manage({...request,requestKey:id()}),isCode('OPERATOR_ALREADY_ENROLLED'));
 assert.equal((await db.query('SELECT count(*)::int n FROM operator_admin_events WHERE user_id=$1',[a.p.userId])).rows[0].n,1);
 await assert.rejects(db.query('DELETE FROM operator_admin_events WHERE user_id=$1',[a.p.userId]),/append-only/);
});
test('AUT-009 rotation/revocation require expected version and invalidate old sessions/seeds',async()=>{
 const a=await operator('administrator'),service=new OperatorAdminService(db,sealer),consoleService=new OperatorConsoleService(db,sealer),code=totp(seed,Math.floor(Date.now()/30000));
 await consoleService.unlock(a.p,code);const replacement=randomBytes(20);
 await assert.rejects(service.manage({action:'rotate',userId:a.p.userId,role:'administrator',secretBase64:replacement.toString('base64'),expectedVersion:999,requestKey:id(),reason}),isCode('VERSION_CONFLICT'));
 const changed=await service.manage({action:'rotate',userId:a.p.userId,role:'administrator',secretBase64:replacement.toString('base64'),expectedVersion:1,requestKey:id(),reason});assert.equal(changed.version,2);
 await assert.rejects(consoleService.session(a.p),isCode('OPERATOR_MFA_REQUIRED'));
 const fresh=await a.identity.createSession(a.p.userId),p={...a.p,sessionId:fresh.sessionId};await assert.rejects(consoleService.unlock(p,code),isCode('MFA_INVALID_OR_REPLAYED'));
 await consoleService.unlock(p,totp(replacement,Math.floor(Date.now()/30000)));await service.manage({action:'revoke',userId:p.userId,expectedVersion:2,requestKey:id(),reason});await assert.rejects(consoleService.session(p),isCode('OPERATOR_MFA_REQUIRED'));
});
test('AUT-009 ordinary, missing MFA, stale MFA and cross-role requests deny; permitted operations audit and replay once',async()=>{
 const ordinary=await account(db),service=new OperatorConsoleService(db,sealer),support=await operator('support'),billing=await operator('billing');
 await assert.rejects(service.unlock(ordinary.p,'123456'),isCode('OPERATOR_FORBIDDEN'));await assert.rejects(service.tickets(support.p),isCode('OPERATOR_MFA_REQUIRED'));
 await service.unlock(support.p,totp(seed,Math.floor(Date.now()/30000)));await service.unlock(billing.p,totp(seed,Math.floor(Date.now()/30000)));
 await assert.rejects(service.controls(support.p),isCode('OPERATOR_FORBIDDEN'));await assert.rejects(service.tickets(billing.p),isCode('OPERATOR_FORBIDDEN'));
 const ticketId=id();await db.query('INSERT INTO support_tickets(id,workspace_id,owner_id,subject,message) VALUES($1,$2,$3,$4,$5)',[ticketId,ordinary.p.workspaceId,ordinary.p.userId,'Fixture support','Private fixture support content']);
 const key=id();assert.equal((await service.ticketStatus(support.p,ticketId,'closed','Reviewed duplicate support fixture',key)).replayed,false);assert.equal((await service.ticketStatus(support.p,ticketId,'closed','Reviewed duplicate support fixture',key)).replayed,true);
 await assert.rejects(service.ticketStatus(support.p,ticketId,'open','Reviewed duplicate support fixture',key),isCode('IDEMPOTENCY_CONFLICT'));
 await db.query("UPDATE operator_sessions SET verified_at=now()-interval '10 minutes',expires_at=now()-interval '5 minutes' WHERE session_id=$1",[support.p.sessionId]);await assert.rejects(service.tickets(support.p),isCode('OPERATOR_MFA_REQUIRED'));
});
test('API-006 operator HTTP console requires account CSRF and recent role-scoped MFA',async()=>{
 const a=await operator('operations'),ordinary=await account(db),app=await buildApi({db,objects:new LocalObjects(join(root,'objects')),origin:'http://localhost:3001',telemetry:silent,sealer});
 try{
  assert.equal((await app.inject({url:'/v1/operator/control-state'})).statusCode,401);assert.equal((await app.inject({url:'/v1/operator/control-state',headers:authHeaders(ordinary.session)})).statusCode,403);
  const code=totp(seed,Math.floor(Date.now()/30000)),headers=authHeaders(a.session);
  assert.equal((await app.inject({method:'POST',url:'/v1/operator/session',headers:{...headers,'x-csrf-token':''},payload:{code}})).statusCode,403);
  const unlock=await app.inject({method:'POST',url:'/v1/operator/session',headers,payload:{code}});assert.equal(unlock.statusCode,200,unlock.body);
  assert.equal((await app.inject({url:'/v1/operator/control-state',headers})).statusCode,200);assert.equal((await app.inject({url:'/v1/operator/billing/accounts',headers})).statusCode,403);
  const patch={providerEnabled:false,runnerEnabled:false,dailyBudgetMicroUsd:0,reason:'Reviewed controlled test shutdown'},key=id();const saved=await app.inject({method:'POST',url:'/v1/operator/control-state',headers:authHeaders(a.session,key),payload:patch});assert.equal(saved.statusCode,200,saved.body);
  const replay=await app.inject({method:'POST',url:'/v1/operator/control-state',headers:authHeaders(a.session,key),payload:patch});assert.equal(replay.json().data.replayed,true);
 }finally{await app.close();}
});
test('SEC-009 native column-only runtime privilege cannot enroll an operator', {skip:!process.env.TEST_DATABASE_URL},async()=>{
 const role='fr_op_test_'+id().replaceAll('-',''),schema=String((await db.query('SELECT current_schema() AS name')).rows[0].name),a=await account(db);
 assert.match(schema,/^[a-z0-9_]+$/);await db.query(`CREATE ROLE ${role} NOLOGIN`);
 try{
  await db.query(`GRANT USAGE ON SCHEMA ${schema} TO ${role}`);await db.query(`GRANT SELECT ON operators TO ${role}`);await db.query(`GRANT UPDATE(last_step) ON operators TO ${role}`);
  await assert.rejects(db.transaction(async tx=>{await tx.query(`SET LOCAL ROLE ${role}`);return new OperatorAdminService(tx,sealer).manage({action:'enroll',userId:a.p.userId,role:'administrator',secretBase64:seed.toString('base64'),requestKey:id(),reason});}),isCode('PROTECTED_OPERATOR_ADMIN_REQUIRED'));
  assert.equal((await db.query('SELECT count(*)::int n FROM operators WHERE user_id=$1',[a.p.userId])).rows[0].n,0);
 }finally{await db.query(`DROP OWNED BY ${role}`);await db.query(`DROP ROLE ${role}`);}
});
