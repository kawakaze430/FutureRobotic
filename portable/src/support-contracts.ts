import {z} from 'zod/v4';
export const supportDeliveryEventSchema=z.strictObject({eventId:z.string().regex(/^[A-Za-z0-9_.:-]{8,150}$/),ticketId:z.uuid(),generation:z.number().int().min(1).max(100000),providerMessageId:z.string().min(1).max(200),status:z.enum(['sent','delivered','bounced','complained']),occurredAt:z.iso.datetime({offset:true})});

export const supportDeliveryStatusSchema=z.strictObject({ticketId:z.uuid(),state:z.enum(['queued','sending','sent','delivered','uncertain','dead','bounced','complained','suppressed']),attempts:z.number().int().nonnegative(),lastError:z.string().nullable(),updatedAt:z.iso.datetime({offset:true}),deliveredAt:z.iso.datetime({offset:true}).nullable()});
export const supportContracts={
 'GET /v1/support/:id/delivery':{response:supportDeliveryStatusSchema,idempotency:false,envelope:true},
 'POST /v1/operator/support/:id/retry':{response:z.strictObject({jobId:z.uuid(),replayed:z.boolean()}),body:z.strictObject({}),idempotency:true,envelope:true},
 'POST /webhooks/support-delivery':{response:z.strictObject({received:z.literal(true),replayed:z.boolean()}),body:supportDeliveryEventSchema,idempotency:false,envelope:false},
} as const;
