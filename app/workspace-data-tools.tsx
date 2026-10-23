'use client';
import React,{useEffect,useState} from 'react';
import {cloudRequest} from '../lib/cloud-workspace';
import {downloadText} from '../lib/local-tools';
export function FileRevisionControls({fileId,content,onSaved}:{fileId:string;content:string;onSaved:()=>void}){
 const [items,setItems]=useState<any[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(){const r=await cloudRequest(`/v1/files/${fileId}/revisions`);setItems(r.items);}
 useEffect(()=>{void load().catch(e=>setError((e as Error).message));},[fileId]);
 return <section className="file-revision-controls"><strong>Editing cloud file · revision {items[0]?.revision??'…'}</strong><button disabled={busy||!items.length} onClick={async()=>{setBusy(true);setError('');try{await cloudRequest(`/v1/files/${fileId}/revision`,'PUT',{content,expectedRevision:items[0].revision},crypto.randomUUID());await load();onSaved();}catch(e){setError((e as Error).message+' Reload the file before retrying a conflicting edit.');}finally{setBusy(false);}}}>{busy?'Saving…':'Save new file revision'}</button><details><summary>Revision provenance</summary>{items.map(r=><p key={r.revision}>v{r.revision} · {Number(r.size_bytes).toLocaleString()} bytes · <code>{r.sha256}</code></p>)}</details>{error&&<p role="alert">{error}</p>}</section>;
}
export function HistoryBatchControls({runIds,onDeleted,ownerId}:{runIds:string[];onDeleted:()=>void;ownerId?:string}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[pending,setPending]=useState<{id:string;operation:'delete'|'export'}|null>(null),[confirm,setConfirm]=useState(false);
 const jobKey=ownerId?'futurerobotic-history-job-'+ownerId:null;
 useEffect(()=>{if(!jobKey)return;try{const value=JSON.parse(localStorage.getItem(jobKey)??'null');if(value&&/^[0-9a-f-]{36}$/.test(value.id)&&['delete','export'].includes(value.operation)){setPending(value);setMessage('A previous history job is ready to check.');}}catch{}},[jobKey]);
 async function poll(job:{id:string;operation:'delete'|'export'}){
  const r=await cloudRequest(`/v1/account/jobs/${job.id}`);
  if(r.status==='dead')throw new Error(`This job needs operator attention: ${r.last_error}`);
  if(r.status!=='completed'){setMessage(`Job ${job.id.slice(0,8)} is ${r.status}. You can check again.`);return;}
  if(job.operation==='export'){const result=await cloudRequest(`/v1/account/exports/${job.id}`);downloadText(JSON.stringify(result.content,null,2),'futurerobotic-history.json','application/json');setMessage('Export downloaded. The server copy expires after 24 hours.');}else{onDeleted();setMessage('Selected history deleted. Accounting metadata is retained.');}
  setPending(null);if(jobKey)localStorage.removeItem(jobKey);setConfirm(false);
 }
 async function start(operation:'delete'|'export'){
  setBusy(true);try{const r=await cloudRequest(`/v1/history/${operation}`,'POST',{runIds},crypto.randomUUID());const j={id:r.jobId,operation};setPending(j);if(jobKey)localStorage.setItem(jobKey,JSON.stringify(j));setMessage('History job queued.');await poll(j);}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
 }
 return <section className="history-batch-controls"><p>{runIds.length} loaded account results. Load more history to include older results, up to 200 per job.</p><button disabled={busy||!runIds.length||runIds.length>200||!!pending} onClick={()=>start('export')}>Export loaded history</button><label><input type="checkbox" checked={confirm} onChange={e=>setConfirm(e.target.checked)}/>I want to delete these loaded results</label><button disabled={busy||!confirm||!runIds.length||runIds.length>200||!!pending} onClick={()=>start('delete')}>Delete loaded history</button>{pending&&<button disabled={busy} onClick={async()=>{setBusy(true);try{await poll(pending);}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>Check job status</button>}{message&&<p role="status">{message}</p>}</section>;
}
export function ResultVersionList({runId,revision}:{runId:string;revision:number}){
 const [items,setItems]=useState<any[]>([]),[error,setError]=useState('');
 useEffect(()=>{void cloudRequest(`/v1/runs/${runId}`).then(r=>setItems(r.results)).catch(e=>setError((e as Error).message));},[runId,revision]);
 return <details className="result-version-list"><summary>Result versions ({items.length})</summary>{items.map(r=><details key={r.version}><summary>v{r.version} · {r.origin==='user_applied_assistant'?'Applied after review':'AI response'}</summary><pre>{r.content}</pre><button onClick={()=>downloadText(r.content,`futurerobotic-version-${r.version}.txt`)}>Download this version</button></details>)}{error&&<p role="alert">{error}</p>}</details>;
}
