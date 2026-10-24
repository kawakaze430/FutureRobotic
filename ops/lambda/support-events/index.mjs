import {createHmac} from 'node:crypto';
/** Lambda is invoked only by its exact SES/SNS topic permission. No API/database
 * or provider credential is available to this relay. Never log the SNS message. */
export function deliveryEvent(record,topicArn){
 if(record?.EventSource!=='aws:sns'||record.Sns?.TopicArn!==topicArn||typeof record.Sns.MessageId!=='string'||typeof record.Sns.Message!=='string'||Buffer.byteLength(record.Sns.Message)>100000)throw Error('INVALID_SUPPORT_NOTIFICATION');
 let message;try{message=JSON.parse(record.Sns.Message);}catch{throw Error('INVALID_SUPPORT_NOTIFICATION');}
 const kind=message.eventType??message.notificationType,status={Send:'sent',Delivery:'delivered',Bounce:'bounced',Complaint:'complained'}[kind];if(!status)return null;
 const tags=message.mail?.tags,ticketId=tags?.support_ticket?.[0],generation=Number(tags?.support_generation?.[0]),providerMessageId=message.mail?.messageId,occurredAt=message.delivery?.timestamp??message.bounce?.timestamp??message.complaint?.timestamp??message.mail?.timestamp;
 if(!/^[a-f0-9-]{36}$/i.test(ticketId??'')||!Number.isSafeInteger(generation)||generation<1||generation>100000||typeof providerMessageId!=='string'||providerMessageId.length>200||!Number.isFinite(Date.parse(occurredAt)))throw Error('INVALID_SUPPORT_NOTIFICATION');
 return {eventId:'sns:'+record.Sns.MessageId,ticketId,generation,providerMessageId,status,occurredAt:new Date(occurredAt).toISOString()};
}
export function createRelay({topicArn,origin,secretArn,readSecret,http=fetch,clock=Date.now}){
 const url=new URL(origin);if(url.protocol!=='https:'||url.origin!==origin||url.username||url.password||!/^arn:aws:sns:[a-z0-9-]+:\d{12}:[A-Za-z0-9_-]+$/.test(topicArn)||!secretArn)throw Error('INVALID_SUPPORT_RELAY_CONFIGURATION');
 let cached,cachedAt=0;
 return async event=>{
  if(!Array.isArray(event?.Records)||event.Records.length>10)throw Error('INVALID_SUPPORT_NOTIFICATION');
  for(const record of event.Records){const payload=deliveryEvent(record,topicArn);if(!payload)continue;
   if(!cached||clock()-cachedAt>300000){const value=JSON.parse(await readSecret(secretArn));if(typeof value.current!=='string'||value.current.length<32)throw Error('INVALID_SUPPORT_RELAY_SECRET');cached=value.current;cachedAt=clock();}
   const body=JSON.stringify(payload),timestamp=Math.floor(clock()/1000).toString(),signature=createHmac('sha256',cached).update(timestamp+':'+body).digest('hex');
   const response=await http(origin+'/webhooks/support-delivery',{method:'POST',redirect:'error',headers:{'content-type':'application/json','x-support-signature':`ts=${timestamp};h1=${signature}`},body,signal:AbortSignal.timeout(5000)});
   if(!response.ok)throw Error('SUPPORT_EVENT_RELAY_FAILED');
  }
  return {processed:true};
 };
}
let relay;
export async function handler(event){
 if(!relay){const {SecretsManagerClient,GetSecretValueCommand}=await import('@aws-sdk/client-secrets-manager');const client=new SecretsManagerClient({});relay=createRelay({topicArn:process.env.TOPIC_ARN,origin:process.env.APP_ORIGIN,secretArn:process.env.SIGNING_SECRET_ARN,readSecret:async arn=>{const value=await client.send(new GetSecretValueCommand({SecretId:arn}));if(!value.SecretString)throw Error('SUPPORT_RELAY_SECRET_UNAVAILABLE');return value.SecretString;}});}
 try{return await relay(event);}catch{throw Error('SUPPORT_NOTIFICATION_FAILED');}
}
