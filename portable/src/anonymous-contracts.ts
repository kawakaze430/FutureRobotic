import {z} from 'zod/v4';
export const anonymousAiInput=z.strictObject({
 tool:z.enum(['convert','generate','explain','review','fix']),source:z.string().min(1).max(16000),
 language:z.string().min(1).max(60),targetLanguage:z.string().min(1).max(60).optional(),instructions:z.string().max(12000).optional(),
});
export const anonymousExecutionInput=z.strictObject({language:z.enum(['Python','JavaScript','C','C++','Java']),source:z.string().min(1).max(40000)});
export const anonymousState=z.enum(['queued','dispatching','completed','failed','uncertain','cancelled']);
const created=z.strictObject({id:z.uuid(),state:anonymousState,replayed:z.boolean()});
const get=<T extends z.ZodType>(response:T)=>({response,idempotency:false as const,envelope:true as const});
const post=<T extends z.ZodType,B extends z.ZodType,I extends boolean>(response:T,body:B,idempotency:I)=>({response,body,idempotency,envelope:true as const});
const requestResult=z.strictObject({id:z.uuid(),operation:z.enum(['ai','execution']),state:anonymousState,output:z.string(),executionResult:z.json().nullable(),errorCode:z.string().nullable(),createdAt:z.iso.datetime(),expiresAt:z.iso.datetime()});
export const anonymousContracts={
 'GET /v1/public/anonymous/config':get(z.strictObject({enabled:z.boolean(),ai:z.boolean(),execution:z.boolean(),contextLimit:z.literal(4000),executionLimit:z.literal(10000),dailyAiLimit:z.literal(2),dailyExecutionLimit:z.literal(3)})),
 'GET /v1/public/anonymous/recovery':get(requestResult.nullable()),
 'POST /v1/public/anonymous/session':post(z.strictObject({csrfToken:z.string(),expiresAt:z.iso.datetime()}),z.strictObject({humanToken:z.string().min(1).max(2048)}),false),
 'POST /v1/public/anonymous/ai':post(created,anonymousAiInput,true),
 'POST /v1/public/anonymous/executions':post(created,anonymousExecutionInput,true),
 'GET /v1/public/anonymous/requests/:id':get(z.strictObject({id:z.uuid(),operation:z.enum(['ai','execution']),state:anonymousState,output:z.string(),executionResult:z.json().nullable(),errorCode:z.string().nullable(),createdAt:z.iso.datetime(),expiresAt:z.iso.datetime()})),
 'POST /v1/public/anonymous/requests/:id/cancel':get(z.strictObject({id:z.uuid(),state:anonymousState})),
} as const;
export type AnonymousAiInput=z.infer<typeof anonymousAiInput>;
export type AnonymousExecutionInput=z.infer<typeof anonymousExecutionInput>;
