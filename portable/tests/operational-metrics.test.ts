import test from 'node:test';
import assert from 'node:assert/strict';
import {operationalMetrics} from '../src/operational-metrics.js';
import type {Db,Row} from '../src/db.js';
function fixture(invalid=false):Db{return {async query<T extends Row>(sql:string){const value=sql.includes('FROM jobs')?{age:invalid?-1:30,dead:2}:sql.includes('execution_jobs')?{total:3}:sql.includes('financial_reconciliation_cases')?{total:4}:{daily_budget_micro_usd:1000,committed:250};return {rows:[value] as unknown as T[],rowCount:1};},async transaction(fn){return fn(this);},async close(){}};}
test('AWS-014 operational EMF metrics have matching dashboard dimensions and no source/user/token data',async()=>{
 const value=await operationalMetrics(fixture(),'staging',1720000000000);assert.equal(value.EstimatedSpendPercent,25);assert.equal(value.UncertainDispatches,3);assert.equal(value.DurableQueueOldestSeconds,30);assert.equal(value.OperationalHeartbeat,1);
 assert.deepEqual(value._aws.CloudWatchMetrics[0].Dimensions,[['Environment']]);assert.equal(value._aws.CloudWatchMetrics[0].Namespace,'FutureRobotic/staging');
 for(const key of ['source','email','token','runId','workspaceId','userId'])assert.equal(JSON.stringify(value).includes('"'+key+'"'),false);
 await assert.rejects(operationalMetrics(fixture(true),'production'),/INVALID_OPERATIONAL_METRIC/);
});
