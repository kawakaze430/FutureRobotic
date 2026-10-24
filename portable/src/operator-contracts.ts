import {z} from 'zod/v4';
const uuid=z.uuid(),timestamp=z.iso.datetime({offset:true}),role=z.enum(['support','billing','operations','administrator']);
const numeric=z.union([z.number().int(),z.string().regex(/^-?\d+$/)]);
export const operatorSessionSchema=z.strictObject({role,permissions:z.array(z.string()),expiresAt:timestamp});
export const operatorUnlockSchema=z.strictObject({code:z.string().regex(/^\d{6}$/)});
const reason=z.string().min(10).max(240);
export const operatorTicketStatusSchema=z.strictObject({status:z.enum(['open','closed']),reason});
export const operatorControlSchema=z.strictObject({providerEnabled:z.boolean(),runnerEnabled:z.boolean(),dailyBudgetMicroUsd:z.number().int().min(0).max(1000000000),reason});
export const operatorReconcileSchema=z.strictObject({reason});
const page=<T extends z.ZodType>(item:T)=>z.strictObject({items:z.array(item),nextCursor:z.string().nullable()});
const ticket=z.strictObject({id:uuid,subject:z.string(),message:z.string(),status:z.enum(['open','closed']),created_at:timestamp});
const billing=z.strictObject({id:uuid,workspace_id:uuid,owner_id:uuid,plan_id:z.string(),status:z.string(),period_start:timestamp,period_end:timestamp,created_at:timestamp});
const event=z.strictObject({id:uuid,actor_id:uuid.nullable(),action:z.string(),resource_id:z.string().nullable(),trace_id:z.string(),created_at:timestamp});
const get=<R extends z.ZodType>(response:R)=>({response,idempotency:false as const,envelope:true as const});
const post=<R extends z.ZodType,B extends z.ZodType,I extends boolean=false>(response:R,body:B,idempotency?:I)=>({response,body,idempotency:(idempotency??false) as I,envelope:true as const});
export const operatorContracts={
 'GET /v1/operator/session':get(operatorSessionSchema),
 'POST /v1/operator/session':post(operatorSessionSchema,operatorUnlockSchema),
 'DELETE /v1/operator/session':get(z.strictObject({locked:z.literal(true)})),
 'GET /v1/operator/tickets':get(page(ticket)),
 'POST /v1/operator/tickets/:id/status':post(z.strictObject({id:uuid,status:z.enum(['open','closed']),replayed:z.boolean()}),operatorTicketStatusSchema,true),
 'GET /v1/operator/billing/accounts':get(page(billing)),
 'GET /v1/operator/control-state':get(z.strictObject({provider_enabled:z.boolean(),runner_enabled:z.boolean(),daily_budget_micro_usd:numeric,updated_at:timestamp})),
 'POST /v1/operator/control-state':post(z.strictObject({updated:z.literal(true),replayed:z.boolean()}),operatorControlSchema,true),
 'GET /v1/operator/audit-events':get(page(event)),
 'POST /v1/operator/reconciliation-queue':post(z.strictObject({jobId:uuid,replayed:z.boolean()}),operatorReconcileSchema,true),
} as const;
export type OperatorSession=z.infer<typeof operatorSessionSchema>;
