import type {Db} from './db.js';
import {audit,fail,hash,id,iso,lock,scope,type Principal} from './common.js';
import {Sealer,constantEqual,mac,totp} from './crypto.js';
import {modelCatalog} from './product-policy.js';
export async function allowedModel(tx:Db,p:Principal,modelId:string){
 const model=modelCatalog.find(m=>m.id===modelId);if(!model)return fail('MODEL_NOT_ALLOWED',403);
 if(model.minimumPlan!=='free'){
  const sub=await tx.query('SELECT id FROM subscriptions WHERE workspace_id=$1 AND owner_id=$2 AND status IN(\'active\',\'trialing\') AND plan_id IN(\'pro\',\'premium\') AND period_start<=now() AND period_end>now()',[p.workspaceId,p.userId]);
  if(!sub.rowCount)fail('MODEL_TIER_REQUIRED',403);
 }return model;
}
export class SpendService {
 constructor(private db:Db){}
 async reserve(runId:string,microUsd:number){
  if(!Number.isSafeInteger(microUsd)||microUsd<0)fail('INVALID_COST_ESTIMATE');
  return this.db.transaction(async tx=>{
   await lock(tx,'provider-spending');
   const control=(await tx.query('SELECT * FROM runtime_controls WHERE id=1 FOR UPDATE')).rows[0];
   if(!control.provider_enabled)fail('PROVIDER_EMERGENCY_STOP',503);
   const prior=await tx.query('SELECT status FROM spend_holds WHERE run_id=$1',[runId]);if(prior.rowCount){if(prior.rows[0].status!=='held')fail('SPEND_ALREADY_FINALIZED',409);return;}
   const day=new Date().toISOString().slice(0,10);await tx.query('INSERT INTO spend_days(day) VALUES($1) ON CONFLICT DO NOTHING',[day]);
   const row=(await tx.query('SELECT * FROM spend_days WHERE day=$1 FOR UPDATE',[day])).rows[0];
   if(Number(row.held_micro_usd)+Number(row.spent_micro_usd)+microUsd>Number(control.daily_budget_micro_usd))fail('DAILY_SPENDING_LIMIT',429);
   await tx.query('UPDATE spend_days SET held_micro_usd=held_micro_usd+$2 WHERE day=$1',[day,microUsd]);
   await tx.query('INSERT INTO spend_holds(run_id,day,micro_usd) VALUES($1,$2,$3)',[runId,day,microUsd]);
  });
 }
 async finalize(tx:Db,runId:string,spent:boolean){
  const r=await tx.query('SELECT * FROM spend_holds WHERE run_id=$1 FOR UPDATE',[runId]);const h=r.rows[0];if(!h||h.status!=='held')return;
  await tx.query('UPDATE spend_days SET held_micro_usd=held_micro_usd-$2,spent_micro_usd=spent_micro_usd+$3 WHERE day=$1',[h.day,h.micro_usd,spent?h.micro_usd:0]);
  await tx.query('UPDATE spend_holds SET status=$2 WHERE run_id=$1',[runId,spent?'spent':'released']);
 }
}
export class AnonymousAllowance {
 constructor(private db:Db,private secret:string){if(secret.length<32)throw new Error('ANON_HASH_SECRET must contain at least 32 characters');}
 async reserve(ip:string,operation:'ai'|'execution',key:string){
  if(!/^[A-Za-z0-9_-]{8,100}$/.test(key))fail('INVALID_IDEMPOTENCY_KEY');
  const subject=mac(this.secret,ip),day=new Date().toISOString().slice(0,10);
  return this.db.transaction(async tx=>{
   await lock(tx,`anonymous:${subject}:${day}:${operation}`);
   const old=await tx.query('SELECT state,result FROM anonymous_usage WHERE subject_hash=$1 AND day=$2 AND operation=$3 AND operation_key=$4',[subject,day,operation,key]);if(old.rowCount)return {subject,day,replayed:true,...old.rows[0]};
   const count=(await tx.query('SELECT count(*)::int AS n FROM anonymous_usage WHERE subject_hash=$1 AND day=$2 AND operation=$3 AND state<>\'released\'',[subject,day,operation])).rows[0].n;
   if(count>=(operation==='ai'?2:3))fail('ANONYMOUS_DAILY_LIMIT',429);
   await tx.query('INSERT INTO anonymous_usage(subject_hash,day,operation,operation_key) VALUES($1,$2,$3,$4)',[subject,day,operation,key]);return {subject,day,replayed:false,state:'reserved',result:null};
  });
 }
}
const permissions={support:['support.read','support.close'],billing:['billing.read'],operations:['controls.read','controls.write'],administrator:['support.read','support.close','billing.read','controls.read','controls.write']} as const;
export class OperatorService {
 constructor(private db:Db,private sealer:Sealer){}
 async authorize(p:Principal,permission:string,code:string){
  return this.db.transaction(async tx=>{
   await scope(tx,p);const r=await tx.query('SELECT * FROM operators WHERE user_id=$1 FOR UPDATE',[p.userId]);const op=r.rows[0];
   if(!op||!op.enabled||!(permissions[op.role as keyof typeof permissions] as readonly string[]).includes(permission)||!/^\d{6}$/.test(code))return fail('OPERATOR_FORBIDDEN',403);
   const secret=Buffer.from(this.sealer.open(op.totp_cipher),'base64'),step=Math.floor(Date.now()/30000);
   const matched=[step-1,step,step+1].find(s=>s>Number(op.last_step)&&constantEqual(totp(secret,s),code));
   if(matched===undefined)fail('MFA_INVALID_OR_REPLAYED',403);
   await tx.query('UPDATE operators SET last_step=$2 WHERE user_id=$1',[p.userId,matched]);await audit(tx,p,'operator.authorized',p.userId,'operator',{permission});return op.role as string;
  });
 }
 async controls(p:Principal,patch?:{providerEnabled:boolean;runnerEnabled:boolean;dailyBudgetMicroUsd:number}){
  if(!patch)return (await this.db.query('SELECT provider_enabled,runner_enabled,daily_budget_micro_usd,updated_at FROM runtime_controls WHERE id=1')).rows[0];
  if(!Number.isSafeInteger(patch.dailyBudgetMicroUsd)||patch.dailyBudgetMicroUsd<0||patch.dailyBudgetMicroUsd>1000000000)fail('INVALID_SPENDING_LIMIT');
  return this.db.transaction(async tx=>{
   await tx.query('UPDATE runtime_controls SET provider_enabled=$1,runner_enabled=$2,daily_budget_micro_usd=$3,updated_at=now() WHERE id=1',[patch.providerEnabled,patch.runnerEnabled,patch.dailyBudgetMicroUsd]);
   await audit(tx,p,'operator.controls_changed','runtime-controls','operator',{providerEnabled:patch.providerEnabled,runnerEnabled:patch.runnerEnabled,dailyBudgetMicroUsd:patch.dailyBudgetMicroUsd});return {updated:true};
  });
 }
}
