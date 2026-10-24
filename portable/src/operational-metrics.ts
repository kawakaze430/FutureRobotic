import type {Db} from './db.js';
/** CloudWatch embedded metrics contain bounded operational totals only. */
export async function operationalMetrics(db:Db,environment:'staging'|'production',now=Date.now()){
 if(!['staging','production'].includes(environment)||!Number.isSafeInteger(now))throw Error('INVALID_METRIC_CONTEXT');
 const queue=(await db.query("SELECT coalesce(max(extract(epoch FROM (now()-created_at))) FILTER(WHERE status='queued'),0) AS age,count(*) FILTER(WHERE status='dead')::int AS dead FROM jobs")).rows[0];
 const uncertain=(await db.query("SELECT (SELECT count(*) FROM tool_runs WHERE status='uncertain')+(SELECT count(*) FROM execution_jobs WHERE state='uncertain')+(SELECT count(*) FROM anonymous_requests WHERE state='uncertain') AS total")).rows[0];
 const finance=(await db.query("SELECT count(*)::int AS total FROM financial_reconciliation_cases WHERE state='open'")).rows[0];
 const spending=(await db.query("SELECT c.daily_budget_micro_usd,coalesce(s.held_micro_usd,0)+coalesce(s.spent_micro_usd,0) AS committed FROM runtime_controls c LEFT JOIN spend_days s ON s.day=current_date WHERE c.id=1")).rows[0];
 const total=Number(spending.committed),budget=Number(spending.daily_budget_micro_usd);
 const values={OperationalHeartbeat:1,DurableQueueOldestSeconds:Number(queue.age),DeadJobs:Number(queue.dead),UncertainDispatches:Number(uncertain.total),OpenFinancialMismatches:Number(finance.total),EstimatedSpendPercent:budget>0?100*total/budget:total>0?100:0};
 if(Object.values(values).some(value=>!Number.isFinite(value)||value<0||value>1e12))throw Error('INVALID_OPERATIONAL_METRIC');
 return {_aws:{Timestamp:now,CloudWatchMetrics:[{Namespace:`FutureRobotic/${environment}`,Dimensions:[['Environment']],Metrics:Object.keys(values).map(Name=>({Name,Unit:Name.endsWith('Seconds')?'Seconds':Name.endsWith('Percent')?'Percent':'Count'}))}]},Environment:environment,...values};
}
