import {modelCatalog} from './product-policy.js';
import {ProviderFailure,type Provider,type ProviderRequest} from './worker.js';
export interface ProviderConfig {endpoint:string;key:string;models:Record<string,string>;inputMicroUsdPerMillion:number;outputMicroUsdPerMillion:number;retentionApproved:boolean}
export async function* readSse(body:ReadableStream<Uint8Array>,signal?:AbortSignal){
 const reader=body.getReader(),decoder=new TextDecoder();let buffer='',total=0;
 try{for(;;){if(signal?.aborted)throw new ProviderFailure('unknown');const r=await reader.read();if(r.done)break;total+=r.value.length;if(total>2000000)throw new ProviderFailure('unknown');buffer+=decoder.decode(r.value,{stream:true});buffer=buffer.replace(/\r\n/g,'\n');let end;while((end=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,end);buffer=buffer.slice(end+2);const data=block.split('\n').filter(s=>s.startsWith('data:')).map(s=>s.slice(5).trimStart()).join('\n');if(data)yield data;}if(buffer.length>100000)throw new ProviderFailure('unknown');}if(buffer.trim())throw new ProviderFailure('unknown');}finally{await reader.cancel().catch(()=>{});}
}
export class HttpCodeProvider implements Provider {
 constructor(private config:ProviderConfig,private http:typeof fetch=fetch){
  const url=new URL(config.endpoint);if(url.protocol!=='https:'||url.username||url.password||url.search||!config.key||!config.retentionApproved)throw new Error('Approved HTTPS provider configuration is required');
  if(!Number.isSafeInteger(config.inputMicroUsdPerMillion)||!Number.isSafeInteger(config.outputMicroUsdPerMillion)||config.inputMicroUsdPerMillion<0||config.outputMicroUsdPerMillion<0)throw new Error('Approved model prices are required');
 }
 estimateMicroUsd(request:ProviderRequest){const bytes=Buffer.byteLength(JSON.stringify(request.messages)),model=modelCatalog.find(m=>m.id===request.modelId)??modelCatalog[0];return Math.ceil((bytes*this.config.inputMicroUsdPerMillion+model.maxOutputTokens*this.config.outputMicroUsdPerMillion)/1000000);}
 async generate(request:ProviderRequest){
  const model=modelCatalog.find(m=>m.id===request.modelId)??modelCatalog[0],providerModel=this.config.models[model.id];if(!providerModel)throw new ProviderFailure('not_sent');
  let response:Response;
  try{response=await this.http(this.config.endpoint,{method:'POST',headers:{authorization:`Bearer ${this.config.key}`,'content-type':'application/json','idempotency-key':request.idempotencyKey,traceparent:`00-${request.traceId}-${request.traceId.slice(0,16)}-01`},body:JSON.stringify({model:providerModel,messages:request.messages,max_tokens:model.maxOutputTokens,stream:true}),signal:request.signal});}
  catch{throw new ProviderFailure('unknown');}
  if(!response.ok){await response.body?.cancel();throw new ProviderFailure(response.status===429||response.status>=500?'unknown':'rejected');}
  if(!response.body)throw new ProviderFailure('unknown');let output='',done=false;
  for await(const data of readSse(response.body,request.signal)){
   if(data==='[DONE]'){done=true;break;}
   let event:any;try{event=JSON.parse(data);}catch{throw new ProviderFailure('unknown');}
   const delta=event.choices?.[0]?.delta?.content;
   if(typeof delta==='string'){output+=delta;if(output.length>200000)throw new ProviderFailure('unknown');if(delta)await request.onDelta?.(delta);}
   if(event.error)throw new ProviderFailure('unknown');
  }
  if(!done||!output)throw new ProviderFailure('unknown');return output;
 }
}
