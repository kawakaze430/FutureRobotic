// Browser-safe transport. No provider key or AWS credential is accepted here.
export interface ApiErrorBody {error:{code:string;requestId:string}}
export interface RunCreated {id:string;status:string;replayed:boolean}
export interface RunSummary {id:string;tool:string;language:string;status:string;created_at:string}
export interface Page<T> {items:T[];nextCursor:string|null}
export interface RunDetail extends RunSummary {source:string;instructions:string;model:string;target_language:string|null;error_code:string|null;updated_at:string;results:{id:string;version:number;content:string;created_at:string}[]}
export class ClientError extends Error {constructor(public status:number,public code:string,public requestId:string){super(code);}}
export class FutureRoboticClient {
  constructor(private baseUrl:string,private csrf:()=>string,private fetcher:typeof fetch=fetch) {}
  async request<T>(path:string,method='GET',body?:unknown,key?:string):Promise<T> {
    const headers:Record<string,string>={};
    if(body!==undefined)headers['content-type']='application/json';
    if(method!=='GET')headers['x-csrf-token']=this.csrf();
    if(key)headers['idempotency-key']=key;
    const r=await this.fetcher(`${this.baseUrl}${path}`,{method,headers,credentials:'include',body:body===undefined?undefined:JSON.stringify(body)});
    const envelope=await r.json() as {data:T}|ApiErrorBody;
    if(!r.ok){const e=envelope as ApiErrorBody;throw new ClientError(r.status,e.error?.code??'INVALID_RESPONSE',e.error?.requestId??'');}
    return (envelope as {data:T}).data;
  }
  createRun(input:{tool:'convert'|'generate'|'explain'|'fix'|'refactor'|'review'|'tests'|'chat';source:string;language:string;instructions?:string;targetLanguage?:string},idempotencyKey:string) {
    return this.request<RunCreated>('/v1/runs','POST',input,idempotencyKey);
  }
  runs(cursor?:string) {return this.request<Page<RunSummary>>(`/v1/runs${cursor?`?cursor=${encodeURIComponent(cursor)}`:''}`);}
  run(runId:string) {return this.request<RunDetail>(`/v1/runs/${encodeURIComponent(runId)}`);}
  cancel(runId:string) {return this.request<{id:string;status:string}>(`/v1/runs/${encodeURIComponent(runId)}/cancel`,'POST');}
}
