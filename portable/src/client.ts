// Browser-safe transport. No provider key or AWS credential is accepted here.
import {parseApiResponse,parseApiError,requireIdempotencyKey,type ApiPath,type ApiMethods,type ApiArguments,type ApiResponse,type RunInput} from './api-contracts.js';
export type {ApiErrorBody,RunDetail,RunSummary,Page,RunInput} from './api-contracts.js';
export type RunCreated=ApiResponse<'/v1/runs','POST'>;
export class ClientError extends Error {constructor(public status:number,public code:string,public requestId:string){super(code);this.name='ClientError';}}
export class FutureRoboticClient {
  constructor(private baseUrl:string,private csrf:()=>string,private fetcher:typeof fetch=fetch) {}
  async request<P extends ApiPath,M extends ApiMethods<P> = Extract<'GET',ApiMethods<P>>>(path:P,...args:ApiArguments<P,M>):Promise<ApiResponse<P,M>> {
    const [providedMethod,body,key,signal]=args,method=providedMethod??'GET';
    requireIdempotencyKey(method,path,key);
    const headers:Record<string,string>={};
    if(body!==undefined)headers['content-type']='application/json';
    if(method!=='GET')headers['x-csrf-token']=this.csrf();
    if(key)headers['idempotency-key']=key;
    const r=await this.fetcher(`${this.baseUrl}${path}`,{method,headers,credentials:'include',body:body===undefined?undefined:JSON.stringify(body),signal});
    let envelope:unknown;
    try{envelope=await r.json();}catch{throw new ClientError(r.status,'INVALID_RESPONSE',r.headers.get('x-request-id')??'');}
    if(!r.ok){let code='INVALID_RESPONSE',requestId=r.headers.get('x-request-id')??'';try{const error=parseApiError(envelope).error;code=error.code;requestId=error.requestId;}catch{}throw new ClientError(r.status,code,requestId);}
    return parseApiResponse(method as M,path,envelope);
  }
  createRun(input:RunInput,idempotencyKey:string) {
    return this.request('/v1/runs','POST',input,idempotencyKey);
  }
  runs(cursor?:string) {return this.request(`/v1/runs${cursor?`?cursor=${encodeURIComponent(cursor)}`:''}` as '/v1/runs'|`/v1/runs?${string}`);}
  run(runId:string) {return this.request(`/v1/runs/${encodeURIComponent(runId)}`);}
  cancel(runId:string) {return this.request(`/v1/runs/${encodeURIComponent(runId)}/cancel`,'POST');}
}
