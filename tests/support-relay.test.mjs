import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,randomUUID} from 'node:crypto';
import {createRelay,deliveryEvent} from '../ops/lambda/support-events/index.mjs';
const topic='arn:aws:sns:ap-south-1:111122223333:owned-support-events',secret='s'.repeat(48),ticketId=randomUUID(),timestamp='2026-10-24T12:00:00.000Z';
const notification=kind=>({EventSource:'aws:sns',Sns:{TopicArn:topic,MessageId:randomUUID(),Message:JSON.stringify({eventType:kind,mail:{messageId:'ses-fixture-message',timestamp,tags:{support_ticket:[ticketId],support_generation:['1']},destination:['private@example.invalid']},delivery:{timestamp},privateRequest:'MUST_NOT_BE_FORWARDED'})}});
test('AWS-012 SNS relay accepts only exact topic records and excludes recipient/support content',async()=>{
 const record=notification('Delivery'),value=deliveryEvent(record,topic);assert.equal(value.status,'delivered');assert.equal(value.ticketId,ticketId);assert.ok(!JSON.stringify(value).includes('private'));
 assert.throws(()=>deliveryEvent({...record,Sns:{...record.Sns,TopicArn:topic+'-other'}},topic),/INVALID/);
 assert.throws(()=>deliveryEvent({...record,EventSource:'untrusted'},topic),/INVALID/);
 const requests=[];const relay=createRelay({topicArn:topic,origin:'https://app.example.invalid',secretArn:'protected-secret-reference',readSecret:async()=>JSON.stringify({current:secret}),clock:()=>Date.parse(timestamp),http:async(url,options)=>{requests.push({url,options});return new Response('{}');}});
 await relay({Records:[record]});const {url,options}=requests[0];assert.equal(url,'https://app.example.invalid/webhooks/support-delivery');assert.equal(options.redirect,'error');const seconds=Math.floor(Date.parse(timestamp)/1000).toString(),expected=createHmac('sha256',secret).update(seconds+':'+options.body).digest('hex');assert.equal(options.headers['x-support-signature'],`ts=${seconds};h1=${expected}`);assert.ok(!options.body.includes('private'));
});
test('AWS-012 relay rejects unverified targets/configuration and surfaces retryable delivery failure without logging secrets',async()=>{
 assert.throws(()=>createRelay({topicArn:topic,origin:'http://app.example.invalid',secretArn:'reference'}),/INVALID/);
 const relay=createRelay({topicArn:topic,origin:'https://app.example.invalid',secretArn:'reference',readSecret:async()=>JSON.stringify({current:secret}),http:async()=>new Response('',{status:503})});
 await assert.rejects(relay({Records:[notification('Bounce')]}),/SUPPORT_EVENT_RELAY_FAILED/);assert.equal(deliveryEvent(notification('Open'),topic),null);
});
