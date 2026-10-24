import test from 'node:test';
import assert from 'node:assert/strict';
import {buildApi} from '../src/api.js';
import {apiContracts,canonicalEndpoint,nonJsonContracts} from '../src/api-contracts.js';
import type {Db} from '../src/db.js';
import type {ObjectStore} from '../src/content.js';
import type {PublicAuth} from '../src/public-auth.js';

const db:Db={async query(){throw Error('Test database is deliberately unavailable');},async transaction(work){return work(this);},async close(){}};
const objects:ObjectStore={async put(){},async get(){return new Uint8Array();},async delete(){}};

test('API-003 all registered routes publish their exact JSON, SSE, binary or redirect contract',async()=>{
 const app=await buildApi({db,objects,origin:'http://localhost:3001'});
 try{
  const response=await app.inject({url:'/openapi.json'});assert.equal(response.statusCode,200);
  const spec=response.json();let jsonRoutes=0,nonJsonRoutes=0;
  for(const [path,operations] of Object.entries(spec.paths as Record<string,Record<string,unknown>>)){
   for(const [verb,operation] of Object.entries(operations)){
    if(!['get','post','put','patch','delete','head'].includes(verb))continue;
    const method=verb==='head'?'GET':verb.toUpperCase(),canonicalPath=path.replaceAll('{id}',':id'),key=canonicalEndpoint(method,canonicalPath);
    const op=operation as {responses:Record<string,{content?:Record<string,{schema:unknown}>}>};
    if(key){
     jsonRoutes++;const success=Object.entries(op.responses).find(([status])=>Number(status)>=200&&Number(status)<300)?.[1];
     assert.ok(success?.content?.['application/json']?.schema,`${verb} ${path} has its JSON schema`);
     assert.ok(Object.keys(success.content['application/json'].schema as object).length>0);
     if(apiContracts[key].envelope){const schema=success.content['application/json'].schema as {properties?:{data?:unknown}};assert.ok(schema.properties?.data);assert.notDeepEqual(schema.properties?.data,{});}
    }else{
     nonJsonRoutes++;const transport=nonJsonContracts[`${method} ${canonicalPath}` as keyof typeof nonJsonContracts];assert.ok(transport,`${verb} ${path} is covered`);
     assert.ok(op.responses[String(transport.status)]);
     if('contentType' in transport)assert.ok(op.responses[String(transport.status)].content?.[transport.contentType]);
    }
    assert.ok(op.responses['500']?.content?.['application/json']);
   }
  }
  assert.ok(jsonRoutes>=50);assert.ok(nonJsonRoutes>=6);
  const visit=(value:unknown):void=>{if(!value||typeof value!=='object')return;const record=value as Record<string,unknown>;if(typeof record.$ref==='string'&&record.$ref.startsWith('#/')){let target:unknown=spec;for(const key of record.$ref.slice(2).split('/'))target=(target as Record<string,unknown>)?.[key.replaceAll('~1','/').replaceAll('~0','~')];assert.ok(target,`OpenAPI ref resolves: ${record.$ref}`);}Object.values(record).forEach(visit);};visit(spec);
  assert.equal((await app.inject({url:'/health',method:'HEAD'})).body,'');
  const unavailable=await app.inject({url:'/ready'});assert.equal(unavailable.statusCode,503);assert.equal(unavailable.json().status,'not_ready');
 }finally{await app.close();}
});

test('API-003 a successful handler with an invalid shape fails closed without leaking unexpected fields',async()=>{
 const auth={providers(){return {google:false,github:false,email:false,unexpectedSecret:'must-not-leak'};}} as unknown as PublicAuth;
 const app=await buildApi({db,objects,origin:'http://localhost:3001',auth});
 try{
  const response=await app.inject({url:'/auth/providers'});assert.equal(response.statusCode,500);
  const result=response.json();assert.equal(result.error.code,'RESPONSE_CONTRACT_VIOLATION');assert.match(result.error.requestId,/^[0-9a-f-]{36}$/);
  assert.equal(response.body.includes('must-not-leak'),false);assert.equal(response.body.includes('unexpectedSecret'),false);
  const denied=await app.inject({url:'/v1/account'});assert.equal(denied.statusCode,401);assert.equal(denied.json().error.code,'UNAUTHENTICATED');
 }finally{await app.close();}
});
