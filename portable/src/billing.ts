import type { Db } from './db.js';
import { audit, fail, hash, id, lock, scope, type Principal } from './common.js';
import { QuotaService } from './quota.js';
// Called only AFTER a provider adapter verifies its raw-body signature.
// Deliberately no HTTP endpoint accepts this trusted event structure.
export interface VerifiedBillingEvent {
 provider:string; eventId:string; rawBody:string; occurredAt:string; subscriptionId:string;
 planId:'pro'|'premium'; status:'active'|'past_due'|'cancelled'|'trialing'; periodStart:string; periodEnd:string;
}
export class BillingService {
  constructor(private db:Db) {}
  async apply(p:Principal,event:VerifiedBillingEvent) {
    if(!Number.isFinite(Date.parse(event.occurredAt))||!(Date.parse(event.periodEnd)>Date.parse(event.periodStart))) fail('INVALID_BILLING_PERIOD');
    return this.db.transaction(async tx=>{
      await lock(tx,`billing-lifecycle:${p.workspaceId}`);await scope(tx,p); await lock(tx,`billing:${event.provider}:${event.subscriptionId}`);
      // Serialize event IDs as well: a replay with a changed target cannot become a second grant.
      await lock(tx,`billing-event:${event.provider}:${event.eventId}`);
      const digest=hash(event.rawBody);
      const prior=await tx.query('SELECT payload_hash,workspace_id FROM billing_events WHERE provider=$1 AND event_id=$2',[event.provider,event.eventId]);
      if(prior.rowCount) {
        if(prior.rows[0].payload_hash!==digest||prior.rows[0].workspace_id!==p.workspaceId) fail('BILLING_REPLAY_CONFLICT',409);
        return {replayed:true};
      }
      const current=await tx.query('SELECT * FROM subscriptions WHERE provider=$1 AND provider_id=$2 FOR UPDATE',[event.provider,event.subscriptionId]);
      if(current.rowCount&&current.rows[0].workspace_id!==p.workspaceId) fail('BILLING_OWNER_CONFLICT',409);
      const stale=current.rowCount&&new Date(current.rows[0].last_event_at).getTime()>=Date.parse(event.occurredAt);
      await tx.query('INSERT INTO billing_events(provider,event_id,payload_hash,workspace_id,owner_id,occurred_at,status) VALUES($1,$2,$3,$4,$5,$6,$7)',[event.provider,event.eventId,digest,p.workspaceId,p.userId,event.occurredAt,stale?'ignored':'processed']);
      if(stale) return {replayed:false,ignored:true};
      const subId=current.rows[0]?.id??id();
      await tx.query('INSERT INTO subscriptions(id,workspace_id,owner_id,provider,provider_id,plan_id,status,period_start,period_end,last_event_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(provider,provider_id) DO UPDATE SET plan_id=excluded.plan_id,status=excluded.status,period_start=excluded.period_start,period_end=excluded.period_end,last_event_at=excluded.last_event_at',[subId,p.workspaceId,p.userId,event.provider,event.subscriptionId,event.planId,event.status,event.periodStart,event.periodEnd,event.occurredAt]);
      if(['active','trialing'].includes(event.status)) {
        const plan=(await tx.query('SELECT advanced_credits FROM plans WHERE id=$1',[event.planId])).rows[0];
        await new QuotaService(tx).monthlyGrant(tx,p,{id:subId,period_start:event.periodStart,period_end:event.periodEnd,provider:event.provider,provider_id:event.subscriptionId,advanced_credits:plan.advanced_credits});
      }
      await audit(tx,p,'billing.event_applied',subId,'billing',{status:event.status});
      return {replayed:false,ignored:false};
    });
  }
  async get(p:Principal) {
    await scope(this.db,p);
    return (await this.db.query('SELECT id,plan_id,status,period_start,period_end FROM subscriptions WHERE workspace_id=$1 AND owner_id=$2 ORDER BY last_event_at DESC',[p.workspaceId,p.userId])).rows;
  }
}
