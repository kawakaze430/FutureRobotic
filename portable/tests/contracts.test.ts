import test from 'node:test';
import assert from 'node:assert/strict';
import {FutureRoboticClient,ClientError} from '../src/client.js';
import {apiContracts,canonicalEndpoint,responseSchemaFor,responseValidatorFor,parseApiResponse,parseRunEvent,ContractError,type ApiResponse,type RunInput} from '../src/api-contracts.js';

const runId='0b6e5b7c-9601-4aef-9439-59cf54058f95';
test('API-003 resolves concrete UUID routes and query cursors to the precise method contract',()=>{
 assert.equal(canonicalEndpoint('GET',`/v1/runs/${runId}/note`),'GET /v1/runs/:id/note');
 assert.equal(canonicalEndpoint('GET',`/v1/chats/${runId}?cursor=opaque`),'GET /v1/chats/:id');
 assert.equal(canonicalEndpoint('GET','/v1/account/exports/pending'),'GET /v1/account/exports/pending');
 assert.equal(canonicalEndpoint('POST',`/v1/runs/${runId}/unknown`),undefined);
 assert.equal(canonicalEndpoint('DELETE','/v1/runs'),undefined);
 assert.deepEqual(parseApiResponse('GET','/v1/runs?cursor=opaque',{data:{items:[],nextCursor:null}}),{items:[],nextCursor:null});
 assert.equal(parseApiResponse('GET',`/v1/runs/${runId}/note`,{data:null}),null);
});
test('API-003 every declared JSON route emits a schema from the same runtime validator',()=>{
 for(const key of Object.keys(apiContracts)){
  const separator=key.indexOf(' '),method=key.slice(0,separator),path=key.slice(separator+1);
  assert.ok(responseSchemaFor(method,path));assert.ok(responseValidatorFor(method,path));
 }
 assert.throws(()=>parseApiResponse('GET','/v1/runs',{data:{items:[],nextCursor:7}}),ContractError);
 assert.throws(()=>parseApiResponse('POST','/v1/runs',{data:{id:runId,status:'queued'}}),ContractError);
 assert.throws(()=>parseApiResponse('GET',`/v1/runs/${runId}/note`,{data:{id:runId,version:1,content:'note',source:'leaked'}}),ContractError);
});
test('API-003 transport preserves idempotency/CSRF/cookies, typed pagination and request IDs',async()=>{
 const requests:{url:string;init:RequestInit|undefined}[]=[];
 const client=new FutureRoboticClient('https://example.invalid',()=> 'csrf-fixture',(async(url,init)=>{
  requests.push({url:String(url),init});
  if(String(url).endsWith('/cancel'))return Response.json({error:{code:'RUN_NOT_TERMINAL',requestId:runId}},{status:409});
  if(init?.method==='POST')return Response.json({data:{id:runId,status:'queued',replayed:false}},{status:202});
  return Response.json({data:{items:[],nextCursor:'opaque-cursor'}});
 }) as typeof fetch);
 const input:RunInput={tool:'convert',source:'print(1)',language:'Python'};
 const result=await client.createRun(input,'contract-operation-1');assert.equal(result.id,runId);
 assert.equal(new Headers(requests[0].init?.headers).get('idempotency-key'),'contract-operation-1');
 assert.equal(new Headers(requests[0].init?.headers).get('x-csrf-token'),'csrf-fixture');
 assert.equal(requests[0].init?.credentials,'include');
 assert.equal((await client.runs('a+b?c')).nextCursor,'opaque-cursor');assert.match(requests[1].url,/cursor=a%2Bb%3Fc$/);
 await assert.rejects(client.cancel(runId),(error:unknown)=>error instanceof ClientError&&error.status===409&&error.code==='RUN_NOT_TERMINAL'&&error.requestId===runId);
 await assert.rejects(client.createRun(input,''),ContractError);assert.equal(requests.length,3);
});
test('API-003 rejects malformed successful responses and enforces SSE delta/terminal payloads',async()=>{
 const client=new FutureRoboticClient('',()=>'',(async()=>Response.json({data:{items:[],nextCursor:4}})) as typeof fetch);
 await assert.rejects(client.runs(),ContractError);
 assert.deepEqual(parseRunEvent('delta',{delta:'hello'}),{type:'delta',data:{delta:'hello'}});
 assert.deepEqual(parseRunEvent('done',{status:'failed',output:'partial',errorCode:null,partial:true}),{type:'done',data:{status:'failed',output:'partial',errorCode:null,partial:true}});
 assert.throws(()=>parseRunEvent('delta',{delta:{source:'invalid'}}),ContractError);
 assert.throws(()=>parseRunEvent('done',{status:'running',output:'not terminal'}),ContractError);
 assert.equal(parseRunEvent('future-event',{anything:true}),undefined);
});

// These assertions compile along with the backend; they are never network calls.
function compileTimeContracts(client:FutureRoboticClient,uuid:string){
 const note:Promise<ApiResponse<`/v1/runs/${string}/note`>>=client.request(`/v1/runs/${uuid}/note`);void note;
 const created:Promise<{id:string;status:string;replayed:boolean}>=client.request('/v1/runs','POST',{tool:'convert',source:'x',language:'Python'},'operation-key');void created;
 // @ts-expect-error A read-only collection has no DELETE contract.
 client.request('/v1/runs','DELETE');
 // @ts-expect-error Idempotent run creation requires its key.
 client.request('/v1/runs','POST',{tool:'convert',source:'x',language:'Python'});
 // @ts-expect-error Input fields are endpoint-specific.
 client.request('/v1/chats','POST',{source:'not a title'});
 // @ts-expect-error Result pagination has no arbitrary properties.
 client.runs().then(result=>result.inventedField);
}
void compileTimeContracts;
