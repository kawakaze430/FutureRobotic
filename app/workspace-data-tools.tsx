'use client';
import React,{useEffect,useState,useRef} from 'react';
import {cloudRequest} from '../lib/cloud-workspace';
import {downloadText} from '../lib/local-tools';
import {readPendingJob,storePendingJob,type PendingJob,SelectionEpoch} from '../lib/workspace-session';
import type {ApiResponse} from '../portable/src/api-contracts';

export interface RecoverableJob {id:string;key:string;operation:'export'|'delete';status:string}
export interface JobFlowState {pending:PendingJob|null;recoverable:RecoverableJob[];status:string;busy:boolean;recovered:boolean;message:string;retryAvailable:boolean;retryCount:number}
export interface JobFlowServices {
 current?():boolean;
 read():PendingJob|null;store(job:PendingJob|null):void;
 discover(signal:AbortSignal):Promise<RecoverableJob[]>;
 create(operation:'export'|'delete',runIds:readonly string[],key:string,signal:AbortSignal):Promise<{jobId:string}>;
 inspect(id:string,signal:AbortSignal):Promise<{status:string}>;
 content(id:string,signal:AbortSignal):Promise<unknown>;
 download(content:unknown):void;deleted():void;
 key():string;
}
const initialJobState=():JobFlowState=>({pending:null,recoverable:[],status:'idle',busy:false,recovered:false,message:'',retryAvailable:false,retryCount:0});

/** Durable intent metadata never includes selected IDs or source content. No POST
 * is repeated by restore/discovery/check: retry requires a separate user action. */
export class OwnedJobFlow {
 state=initialJobState();private listeners=new Set<(state:JobFlowState)=>void>();private abort=new AbortController();private epoch=0;private active=true;private selection:readonly string[]|null=null;
 constructor(private services:JobFlowServices,private scope:'account'|'history'){}
 subscribe(listener:(state:JobFlowState)=>void){this.listeners.add(listener);listener(this.state);return()=>{this.listeners.delete(listener);};}
 private current(){return this.active&&this.services.current?.()!==false;}
 private update(change:Partial<JobFlowState>){if(!this.current())return;this.state={...this.state,...change};for(const listener of this.listeners)listener(this.state);}
 private save(job:PendingJob|null){if(!this.current())return;this.services.store(job);this.update({pending:job});}
 private valid(epoch:number){return this.current()&&epoch===this.epoch;}
 dispose(){this.active=false;this.epoch++;this.abort.abort();this.listeners.clear();this.selection=null;}
 async restore(){
  if(!this.current()||this.state.busy)return;
  const saved=this.services.read();if(saved&&(this.scope==='history'||saved.operation==='export')){if(this.scope==='account'&&!saved.id)this.selection=[];this.update({pending:saved,status:saved.id?'unknown':'uncertain'});}
  await this.discover();
 }
 async discover(){
  if(!this.current()||this.state.busy)return;const epoch=++this.epoch;this.update({busy:true});
  try{
   const jobs=await this.services.discover(this.abort.signal);if(!this.valid(epoch))return;
   const pending=this.state.pending;
   const match=pending?jobs.find(job=>pending.id?job.id===pending.id:job.key===pending.key):jobs.find(job=>['queued','running','dead'].includes(job.status));
   this.update({recoverable:jobs,recovered:true});
   if(match){const known={id:match.id,key:match.key,operation:match.operation};this.save(known);this.update({status:match.status,message:match.status==='dead'?'A previous job stopped and needs attention. It has not been retried.':`A previous ${match.operation} job is ${match.status}. Check it to continue.`,retryAvailable:false});}
   else if(pending)this.update({status:pending.id?this.state.status:'uncertain',message:pending.id?'Your previous job is ready to check.':'The request outcome is still unconfirmed. Checking recovery does not resend it.',retryAvailable:this.selection!==null});
   else this.update({status:'idle',message:jobs.length?'Previous exports or completed jobs are available to recover.':''});
  }catch{if(this.valid(epoch))this.update({message:'Existing jobs could not be checked. Check recovery before starting a new request.'});}
  finally{if(this.valid(epoch))this.update({busy:false});}
 }
 async start(operation:'export'|'delete',runIds:readonly string[]=[]){
  if(!this.current()||this.state.busy||this.state.pending||!this.state.recovered||this.scope==='account'&&operation!=='export')return;
  if(this.scope==='history'&&(!runIds.length||runIds.length>200||new Set(runIds).size!==runIds.length))return;
  this.selection=[...runIds];this.update({retryCount:runIds.length});const intent={id:'',key:this.services.key(),operation};this.save(intent);await this.send(intent);
 }
 async retry(){
  const pending=this.state.pending;
  if(!this.current()||!pending||pending.id||this.state.busy||!this.state.retryAvailable||this.selection===null)return;
  // The same captured selection and key are used only after an explicit click.
  await this.send(pending);
 }
 private async send(intent:PendingJob){
  const epoch=++this.epoch;this.update({busy:true,status:'uncertain',message:'Submitting this request…',retryAvailable:false});
  try{
   const result=await this.services.create(intent.operation,this.selection??[],intent.key,this.abort.signal);if(!this.valid(epoch))return;
   this.save({...intent,id:result.jobId});this.update({status:'queued',message:'Job queued. Check its status to continue.'});
  }catch(error){if(!this.valid(epoch))return;
   const status=(error as {status?:number})?.status;
   if(status!==undefined&&[400,401,403,404,413,415,422].includes(status)){this.save(null);this.selection=null;this.update({status:'idle',message:error instanceof Error?error.message:'This request was rejected.'});}
   else this.update({status:'uncertain',message:'The request outcome is unconfirmed. Check recovery before retrying; no duplicate request has been sent.',retryAvailable:this.selection!==null});
  }finally{if(this.valid(epoch))this.update({busy:false});}
 }
 async recover(job:RecoverableJob){
  if(this.state.busy||!this.current())return;
  if(this.state.pending&&this.state.pending.key!==job.key){this.update({message:'Resolve the current request before replacing it with another job.'});return;}
  this.save({id:job.id,key:job.key,operation:job.operation});this.update({status:job.status});await this.check();
 }
 async check(){
  const pending=this.state.pending;if(!pending||this.state.busy||!this.current())return;
  if(!pending.id){await this.discover();return;}
  const epoch=++this.epoch;this.update({busy:true});
  try{
   const job=await this.services.inspect(pending.id,this.abort.signal);if(!this.valid(epoch))return;
   if(job.status==='dead'){this.update({status:'dead',message:'This job stopped before completing. No automatic retry was sent. Keep its reference for support.'});return;}
   if(job.status!=='completed'){this.update({status:job.status,message:['queued','running'].includes(job.status)?`Your ${pending.operation} job is ${job.status}. Check again shortly.`:'The job status is unavailable. No request has been repeated.'});return;}
   if(pending.operation==='export'){
    let content:unknown;try{content=await this.services.content(pending.id,this.abort.signal);}catch(error){if(this.valid(epoch)&&(error as {status?:number}).status===404){this.update({status:'expired',message:'This completed export is no longer available. Dismiss it before requesting a new export.'});return;}throw error;}
    if(!this.valid(epoch))return;this.services.download(content);
   }else this.services.deleted();
   if(!this.valid(epoch))return;this.save(null);this.selection=null;this.update({status:'completed',retryAvailable:false,recoverable:this.state.recoverable.filter(job=>job.id!==pending.id),message:pending.operation==='export'?'Export downloaded. The server copy expires after 24 hours.':'Selected history deleted. Accounting metadata is retained.'});
  }catch{if(this.valid(epoch))this.update({message:'The job could not be checked or downloaded. Its request is retained; try checking again.'});}
  finally{if(this.valid(epoch))this.update({busy:false});}
 }
 dismissStopped(){if(!['dead','expired'].includes(this.state.status)||this.state.busy)return;const id=this.state.pending?.id;this.save(null);this.selection=null;this.update({status:'idle',retryAvailable:false,recoverable:this.state.recoverable.filter(job=>job.id!==id),message:'Previous job dismissed. A new request requires your action.'});}
}

export function useOwnedJobFlow(ownerId:string|undefined,scope:'account'|'history',onDeleted?:()=>void){
 const [state,setState]=useState<JobFlowState>(initialJobState),flow=useRef<OwnedJobFlow|null>(null),deletedRef=useRef(onDeleted),currentOwner=useRef(ownerId),flowOwner=useRef(ownerId);deletedRef.current=onDeleted;currentOwner.current=ownerId;
 useEffect(()=>{
  setState(initialJobState());flowOwner.current=ownerId;if(!ownerId){flow.current=null;return;}
  const storage={getItem:(key:string)=>localStorage.getItem(key),setItem:(key:string,value:string)=>localStorage.setItem(key,value),removeItem:(key:string)=>localStorage.removeItem(key)};
  const controller=new OwnedJobFlow({
   current:()=>currentOwner.current===ownerId,
   read:()=>readPendingJob(storage,ownerId,scope),store:job=>storePendingJob(storage,ownerId,scope,job),
   discover:async signal=>scope==='account'?(await cloudRequest('/v1/account/exports/pending','GET',undefined,undefined,signal)).items.map(job=>({id:job.jobId,key:job.requestKey,operation:'export' as const,status:job.status})):(await cloudRequest('/v1/history/jobs/pending','GET',undefined,undefined,signal)).items.map(job=>({id:job.id,key:job.requestKey,operation:job.kind==='delete_history'?'delete' as const:'export' as const,status:job.status})),
   create:(operation,runIds,key,signal)=>scope==='account'?cloudRequest('/v1/account/exports','POST',undefined,key,signal):operation==='delete'?cloudRequest('/v1/history/delete','POST',{runIds:[...runIds]},key,signal):cloudRequest('/v1/history/export','POST',{runIds:[...runIds]},key,signal),
   inspect:(id,signal)=>cloudRequest(`/v1/account/jobs/${id}`,'GET',undefined,undefined,signal),
   content:async(id,signal)=>(await cloudRequest(`/v1/account/exports/${id}`,'GET',undefined,undefined,signal)).content,
   download:content=>downloadText(JSON.stringify(content,null,2),scope==='account'?'futurerobotic-account.json':'futurerobotic-history.json','application/json'),deleted:()=>deletedRef.current?.(),key:()=>crypto.randomUUID(),
  },scope);flow.current=controller;const unsubscribe=controller.subscribe(setState);void controller.restore();return()=>{unsubscribe();controller.dispose();if(flow.current===controller)flow.current=null;};
 },[ownerId,scope]);
 return {state:flowOwner.current===ownerId?state:initialJobState(),flow};
}
export function JobRecoveryControls({state,flow,confirmRetry=false}:{state:JobFlowState;flow:React.RefObject<OwnedJobFlow|null>;confirmRetry?:boolean}){
 return <>{state.pending&&<><p>Job reference: {state.pending.id?state.pending.id.slice(0,8):'unconfirmed request'} · {state.status}</p><button disabled={state.busy} onClick={()=>void flow.current?.check()}>Check job status</button>{!state.pending.id&&state.retryAvailable&&<button disabled={state.busy||(state.pending.operation==='delete'&&!confirmRetry)} onClick={()=>void flow.current?.retry()}>Retry the same {state.pending.operation} request</button>}{['dead','expired'].includes(state.status)&&<button disabled={state.busy} onClick={()=>flow.current?.dismissStopped()}>{state.status==='expired'?'Dismiss expired export':'Dismiss stopped job'}</button>}</>}{!state.pending&&state.recoverable.length>0&&<details><summary>Recover previous jobs</summary>{state.recoverable.map(job=><p key={job.id}>{job.operation} · {job.status} · {job.id.slice(0,8)} <button disabled={state.busy} onClick={()=>void flow.current?.recover(job)}>Check this job</button></p>)}</details>}<button disabled={state.busy||!flow.current} onClick={()=>void flow.current?.discover()}>Check recovery</button>{state.message&&<p role="status">{state.message}</p>}</>;
}

export function FileRevisionControls({fileId,content,onSaved}:{fileId:string;content:string;onSaved:()=>void}){
 const [items,setItems]=useState<ApiResponse<`/v1/files/${string}/revisions`>['items']>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);const epoch=useRef(new SelectionEpoch()),saving=useRef(false);
 useEffect(()=>{const current=epoch.current.next(),controller=new AbortController();setItems([]);setError('');setBusy(false);saving.current=false;void cloudRequest(`/v1/files/${fileId}/revisions`,'GET',undefined,undefined,controller.signal).then(result=>{if(epoch.current.current(current))setItems(result.items);}).catch(error=>{if(epoch.current.current(current)&&!controller.signal.aborted)setError((error as Error).message);});return()=>{epoch.current.next();controller.abort();};},[fileId]);
 async function save(){if(saving.current||!items.length)return;saving.current=true;setBusy(true);setError('');const current=epoch.current.capture(),target=fileId;
  try{await cloudRequest(`/v1/files/${target}/revision`,'PUT',{content,expectedRevision:items[0].revision},crypto.randomUUID());if(!epoch.current.current(current))return;const result=await cloudRequest(`/v1/files/${target}/revisions`);if(!epoch.current.current(current))return;setItems(result.items);onSaved();}catch(error){if(epoch.current.current(current))setError((error as Error).message+' Reload the file before retrying a conflicting edit.');}finally{if(epoch.current.current(current)){saving.current=false;setBusy(false);}}
 }
 return <section className="file-revision-controls"><strong>Editing cloud file · revision {items[0]?.revision??'…'}</strong><button disabled={busy||!items.length} onClick={()=>void save()}>{busy?'Saving…':'Save new file revision'}</button><details><summary>Revision provenance</summary>{items.map(item=><p key={item.revision}>v{item.revision} · {Number(item.size_bytes).toLocaleString()} bytes · <code>{item.sha256}</code></p>)}</details>{error&&<p role="alert">{error}</p>}</section>;
}
export function HistoryBatchControls({runIds,onDeleted,ownerId}:{runIds:string[];onDeleted:()=>void;ownerId?:string}){
 const {state,flow}=useOwnedJobFlow(ownerId,'history',onDeleted),[confirm,setConfirm]=useState(false);useEffect(()=>setConfirm(false),[ownerId,runIds.join(',')]);
 const disabled=!ownerId||state.busy||!state.recovered||!runIds.length||runIds.length>200||!!state.pending;
 return <section className="history-batch-controls"><p>{runIds.length} loaded account results. Load more history to include older results, up to 200 per job.</p><button disabled={disabled} onClick={()=>void flow.current?.start('export',runIds)}>Export loaded history</button><label><input type="checkbox" checked={confirm} onChange={event=>setConfirm(event.target.checked)}/>{state.pending?.operation==='delete'&&state.retryAvailable?`I confirm retrying deletion of the original ${state.retryCount} selected results`:'I want to delete these loaded results'}</label><button disabled={disabled||!confirm} onClick={()=>{setConfirm(false);void flow.current?.start('delete',runIds);}}>Delete loaded history</button><JobRecoveryControls state={state} flow={flow} confirmRetry={confirm}/></section>;
}
export function ResultVersionList({runId,revision}:{runId:string;revision:number}){
 const [items,setItems]=useState<ApiResponse<`/v1/runs/${string}`>['results']>([]),[error,setError]=useState('');const epoch=useRef(new SelectionEpoch());
 useEffect(()=>{const current=epoch.current.next(),controller=new AbortController();setItems([]);setError('');void cloudRequest(`/v1/runs/${runId}`,'GET',undefined,undefined,controller.signal).then(result=>{if(epoch.current.current(current))setItems(result.results);}).catch(error=>{if(epoch.current.current(current)&&!controller.signal.aborted)setError((error as Error).message);});return()=>{epoch.current.next();controller.abort();};},[runId,revision]);
 return <details className="result-version-list"><summary>Result versions ({items.length})</summary>{items.map(item=><details key={item.version}><summary>v{item.version} · {item.origin==='user_applied_assistant'?'Applied after review':item.origin==='local_tool'?'Local tool snapshot':'AI response'}</summary><pre>{item.content}</pre><button onClick={()=>downloadText(item.content,`futurerobotic-version-${item.version}.txt`)}>Download this version</button></details>)}{error&&<p role="alert">{error}</p>}</details>;
}
