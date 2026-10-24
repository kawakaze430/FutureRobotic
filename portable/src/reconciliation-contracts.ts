import {z} from 'zod/v4';
export const reconciliationInput=z.strictObject({kind:z.enum(['checkout','subscription','adjustment','provider_run']),resourceId:z.string().min(3).max(200),transactionId:z.string().min(3).max(200).optional(),subscriptionId:z.string().min(3).max(200).optional()});
const result=z.strictObject({id:z.uuid(),provider:z.string(),resourceKind:z.enum(['checkout','subscription','adjustment','provider_run']),resourceId:z.string(),outcome:z.enum(['matched','corrected','mismatch','unknown','unsupported','stale']),reason:z.string(),correctionApplied:z.boolean(),replayed:z.boolean(),observedAt:z.iso.datetime({offset:true})});
export const reconciliationContracts={
 'POST /v1/operator/reconciliation/inspect':{body:reconciliationInput,response:result,idempotency:false,envelope:true},
 'GET /v1/operator/reconciliation/cases':{response:z.strictObject({items:z.array(z.strictObject({id:z.uuid(),provider:z.string(),resource_kind:z.string(),resource_id:z.string(),workspace_id:z.uuid(),owner_id:z.uuid(),reason:z.string(),state:z.enum(['open','resolved']),updated_at:z.iso.datetime({offset:true})}))}),idempotency:false,envelope:true},
} as const;
