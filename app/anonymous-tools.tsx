'use client';
import React,{useEffect,useRef,useState} from 'react';
import {cloudRequest,csrfToken} from '../lib/cloud-workspace';
import {useDialogFocus} from '../lib/dialog-focus';
import {HumanChallenge} from './account-login';
import type {ApiResponse} from '../portable/src/api-contracts';
import type {AnonymousAiInput,AnonymousExecutionInput} from '../portable/src/anonymous-contracts';
function PublicDialog({children,onClose}:{children:React.ReactNode;onClose:()=>void}){const ref=useRef<HTMLElement|null>(null);useDialogFocus(ref,onClose);return <div className="modal-backdrop"><section ref={ref} className="modal" role="dialog" aria-modal="true" aria-label="Verify public tool access">{children}</section></div>;}
type Pending={key:string;operation:'ai'|'execution';id:string|null};
type Result=ApiResponse<`/v1/public/anonymous/requests/${string}`>;
const storageKey='futurerobotic-public-pending-v1';
function load():Pending|null{try{const p=JSON.parse(sessionStorage.getItem(storageKey)??'null');return p&&/^[A-Za-z0-9_-]{8,100}$/.test(p.key)&&['ai','execution'].includes(p.operation)&&(p.id===null||/^[a-f0-9-]{36}$/.test(p.id))?p:null;}catch{return null;}}
function persist(p:Pending|null){try{if(p)sessionStorage.setItem(storageKey,JSON.stringify(p));else sessionStorage.removeItem(storageKey);}catch{}}
export function useAnonymousTools(){
 const [config,setConfig]=useState<ApiResponse<'/v1/public/anonymous/config'>|null>(null),[pending,setPending]=useState<Pending|null>(null),[challenge,setChallenge]=useState(false),[human,setHuman]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[recovered,setRecovered]=useState<Result|null>(null);
 const current=useRef<Pending|null>(null),alive=useRef(true),checking=useRef(false);
 useEffect(()=>{alive.current=true;current.current=load();setPending(current.current);void cloudRequest('/v1/public/anonymous/config').then(value=>{if(alive.current)setConfig(value);}).catch(()=>{});return()=>{alive.current=false;};},[]);
 function remember(value:Pending|null){current.current=value;persist(value);if(alive.current)setPending(value);}
 async function getPending(value:Pending,signal?:AbortSignal):Promise<Result|null>{return value.id?cloudRequest(`/v1/public/anonymous/requests/${value.id}`,'GET',undefined,undefined,signal):cloudRequest(`/v1/public/anonymous/recovery?key=${encodeURIComponent(value.key)}&operation=${value.operation}`,'GET',undefined,undefined,signal);}
 async function run(operation:'ai',input:AnonymousAiInput,signal:AbortSignal):Promise<Result>;
 async function run(operation:'execution',input:AnonymousExecutionInput,signal:AbortSignal):Promise<Result>;
 async function run(operation:'ai'|'execution',input:AnonymousAiInput|AnonymousExecutionInput,signal:AbortSignal):Promise<Result>{
  if(!(operation==='ai'?config?.ai:config?.execution))throw Error('Public access is not available.');
  if(current.current)throw Error('Check your previous request before starting another one. It has not been repeated.');
  if(!csrfToken(true)){setChallenge(true);throw Error('Complete human verification, then run your request.');}
  const intent:Pending={key:crypto.randomUUID(),operation,id:null};remember(intent);setRecovered(null);
  try{
   const created=operation==='ai'?await cloudRequest('/v1/public/anonymous/ai','POST',input as AnonymousAiInput,intent.key,signal):await cloudRequest('/v1/public/anonymous/executions','POST',input as AnonymousExecutionInput,intent.key,signal);
   intent.id=created.id;remember({...intent});
  }catch(error){const status=(error as {status?:number}).status,code=(error as {code?:string}).code;const safe=['INVALID_REQUEST','INVALID_ANONYMOUS_INPUT','ANONYMOUS_CONTEXT_LIMIT','EXECUTION_INPUT_LIMIT','INVALID_IDEMPOTENCY_KEY','ANONYMOUS_SESSION_REQUIRED','CSRF_TOKEN','CSRF_ORIGIN','ANONYMOUS_DAILY_LIMIT','ANONYMOUS_BACKLOG_FULL','DAILY_SPENDING_LIMIT','PROVIDER_EMERGENCY_STOP','RUNNER_EMERGENCY_STOP','ANONYMOUS_NOT_ENABLED','AUTH_RATE_LIMIT'];if(code&&safe.includes(code)){remember(null);if(status===401)setChallenge(true);}throw error;}
  for(let attempt=0;attempt<45;attempt++){
   signal.throwIfAborted();const result=await getPending(intent,signal);
   if(result&&['completed','failed','cancelled'].includes(result.state)){remember(null);if(result.state==='completed'||result.output)return result;throw Error(result.errorCode?.replaceAll('_',' ').toLowerCase()??'The request did not complete.');}
   if(result?.state==='uncertain')throw Error('The outcome is unconfirmed. Check this request later; it will not be repeated.');
   await new Promise<void>((resolve,reject)=>{const aborted=()=>{clearTimeout(timer);reject(new DOMException('Cancelled.','AbortError'));};const timer=setTimeout(()=>{signal.removeEventListener('abort',aborted);resolve();},750);signal.addEventListener('abort',aborted,{once:true});if(signal.aborted)aborted();});
  }
  throw Error('This request is still processing. Use Check previous request to recover it.');
 }
 async function check(){if(checking.current||!current.current)return;checking.current=true;setBusy(true);setMessage('');try{const result=await getPending(current.current);if(!alive.current)return;if(!result){setMessage('The outcome is still unconfirmed. No request was resent.');return;}if(['completed','failed','cancelled'].includes(result.state)){remember(null);setRecovered(result);}else setMessage(result.state==='uncertain'?'Outcome unconfirmed; no automatic retry will be sent.':'Your request is '+result.state+'. Check again shortly.');}catch(error){if(alive.current){if((error as {code?:string}).code==='ANONYMOUS_SESSION_REQUIRED'){remember(null);setMessage('This recovery session expired. The old request has not been resent.');}else setMessage((error as Error).message);}}finally{checking.current=false;if(alive.current)setBusy(false);}}
 const panel=config?.enabled?<section className="public-request-controls" aria-label="Public tool access"><p>Public access: up to 2 AI requests and 3 executions per day. Availability and fair-use checks apply.</p>{pending&&<><p>A previous {pending.operation} request is available to check.</p><button disabled={busy} onClick={()=>void check()}>Check previous request</button>{pending.id&&<button disabled={busy} onClick={async()=>{setBusy(true);try{const result=await cloudRequest(`/v1/public/anonymous/requests/${pending.id}/cancel`,'POST');if(result.state==='cancelled'){remember(null);setMessage('Queued request cancelled.');}}catch(error){setMessage((error as Error).message);}finally{if(alive.current)setBusy(false);}}}>Cancel queued request</button>}</>}{recovered&&<details open><summary>Recovered {recovered.operation} result · {recovered.state}</summary><pre>{recovered.operation==='execution'?JSON.stringify(recovered.executionResult,null,2):recovered.output||recovered.errorCode}</pre><p>This recovered result has not replaced the current editor.</p></details>}{message&&<p role="status">{message}</p>}{challenge&&<PublicDialog onClose={()=>{setHuman('');setChallenge(false);}}><button aria-label="Close public verification" onClick={()=>{setHuman('');setChallenge(false);}}>×</button><h2>Verify public tool access</h2><HumanChallenge action="anonymous_dispatch" onToken={setHuman}/><button disabled={!human||busy||!!pending} onClick={async()=>{setBusy(true);try{await cloudRequest('/v1/public/anonymous/session','POST',{humanToken:human});setHuman('');setChallenge(false);setMessage('Access verified. You can run your request.');}catch(error){setMessage((error as Error).message);}finally{if(alive.current)setBusy(false);}}}>Verify access</button><p>Verification does not submit your code.</p></PublicDialog>}</section>:null;
 return {ai:!!config?.ai,execution:!!config?.execution,run,panel};
}
