import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {OwnedJobFlow,HistoryBatchControls,ResultVersionList,type JobFlowServices,type RecoverableJob} from '../app/workspace-data-tools';
import {CloudDataControls} from '../app/cloud-account-tools';
import {readPendingJob,storePendingJob,jobStorageKey,type PendingJob} from '../lib/workspace-session';

const owner='17defd29-54da-40e7-86ca-6699a29aff2c',jobId='0b6e5b7c-9601-4aef-9439-59cf54058f95',key='intent-idempotency-fixture';
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(done=>{resolve=done;});return {promise,resolve};}
function harness(scope:'account'|'history'='history'){
 const data=new Map<string,string>(),storage={getItem:(name:string)=>data.get(name)??null,setItem:(name:string,value:string)=>{data.set(name,value);},removeItem:(name:string)=>{data.delete(name);}};
 const calls:{operation:string;ids:readonly string[];key:string}[]=[],downloads:unknown[]=[],deletions:number[]=[];
 let jobs:RecoverableJob[]=[],status='queued';
 const services:JobFlowServices={read:()=>readPendingJob(storage,owner,scope),store:job=>storePendingJob(storage,owner,scope,job),discover:async()=>jobs,create:async(operation,ids,requestKey)=>{calls.push({operation,ids:[...ids],key:requestKey});return {jobId};},inspect:async()=>({status}),content:async()=>({fixture:'owned data'}),download:value=>{downloads.push(value);},deleted:()=>{deletions.push(1);},key:()=>key};
 return {services,data,calls,downloads,deletions,setJobs:(value:RecoverableJob[])=>{jobs=value;},setStatus:(value:string)=>{status=value;},saved:()=>readPendingJob(storage,owner,scope),flow:()=>new OwnedJobFlow(services,scope)};
}

test('HIS-005/AUT-008 persists metadata before POST, blocks duplicate requests and checks queued/running/completed explicitly',async()=>{
 const h=harness();const post=deferred<{jobId:string}>();h.services.create=async(operation,ids,requestKey)=>{
  assert.deepEqual(h.saved(),{id:'',key,operation:'delete'});assert.equal(h.data.get(jobStorageKey(owner,'history'))?.includes('private-run-id'),false);
  h.calls.push({operation,ids:[...ids],key:requestKey});return post.promise;
 };
 const flow=h.flow();await flow.restore();const started=flow.start('delete',['private-run-id']);await flow.start('delete',['another-id']);assert.equal(h.calls.length,1);assert.equal(flow.state.busy,true);
 post.resolve({jobId});await started;assert.equal(flow.state.status,'queued');assert.equal(h.downloads.length,0);assert.equal(h.deletions.length,0);
 await flow.check();assert.equal(flow.state.status,'queued');h.setStatus('running');await flow.check();assert.equal(flow.state.status,'running');h.setStatus('completed');await flow.check();assert.equal(h.deletions.length,1);assert.equal(flow.state.pending,null);assert.equal(h.saved(),null);flow.dispose();
});
test('HIS-005 uncertain mutation keeps its key and retries the original in-memory selection only after explicit action',async()=>{
 const h=harness();let first=true;h.services.create=async(operation,ids,requestKey)=>{h.calls.push({operation,ids:[...ids],key:requestKey});if(first){first=false;throw new TypeError('Network lost');}return {jobId};};
 const flow=h.flow();await flow.restore();const selected=['private-run-a'];await flow.start('delete',selected);selected[0]='private-run-b';assert.equal(flow.state.status,'uncertain');assert.equal(flow.state.retryAvailable,true);assert.equal(h.saved()?.key,key);
 await flow.discover();assert.equal(h.calls.length,1);await flow.check();assert.equal(h.calls.length,1);
 await flow.retry();assert.equal(h.calls.length,2);assert.deepEqual(h.calls[1],{operation:'delete',ids:['private-run-a'],key});flow.dispose();
});
test('HIS-005 reload reconciles a completed uncertain deletion by server request key without resending or storing selection',async()=>{
 const h=harness();h.services.store({id:'',key,operation:'delete'});h.setJobs([{id:jobId,key,operation:'delete',status:'completed'}]);h.setStatus('completed');
 const flow=h.flow();await flow.restore();assert.equal(h.calls.length,0);assert.equal(h.deletions.length,0);assert.equal(flow.state.pending?.id,jobId);assert.equal(flow.state.retryAvailable,false);
 await flow.check();assert.equal(h.calls.length,0);assert.equal(h.deletions.length,1);assert.equal(h.saved(),null);flow.dispose();
});
test('HIS-005 a reloaded unconfirmed destructive request cannot retry without its original private selection',async()=>{
 const h=harness();h.services.store({id:'',key,operation:'delete'});const flow=h.flow();await flow.restore();await flow.retry();await flow.start('delete',['different-selection']);assert.equal(h.calls.length,0);assert.equal(flow.state.status,'uncertain');assert.equal(flow.state.retryAvailable,false);assert.equal(h.saved()?.key,key);flow.dispose();
});
test('AUT-008 account export recovery uses owned server metadata when storage is blocked and never downloads on restore',async()=>{
 const h=harness('account');const blocked={getItem(){throw new Error('Storage blocked');},setItem(){throw new Error('Storage blocked');},removeItem(){throw new Error('Storage blocked');}};
 h.services.read=()=>readPendingJob(blocked,owner,'account');h.services.store=job=>storePendingJob(blocked,owner,'account',job);h.setJobs([{id:jobId,key,operation:'export',status:'queued'}]);h.setStatus('completed');
 const flow=h.flow();await flow.restore();assert.equal(flow.state.pending?.id,jobId);assert.equal(h.downloads.length,0);assert.equal(h.calls.length,0);await flow.check();assert.equal(h.downloads.length,1);assert.equal(h.calls.length,0);flow.dispose();
});
test('HIS-005 stopped jobs expose a safe status and expired exports can be explicitly dismissed',async()=>{
 const h=harness();const job:PendingJob={id:jobId,key,operation:'export'};h.services.store(job);h.setStatus('dead');h.services.inspect=async()=>({status:'dead',last_error:'private backend diagnostic'});
 const flow=h.flow();await flow.restore();await flow.check();assert.equal(flow.state.status,'dead');assert.equal(flow.state.message.includes('private backend diagnostic'),false);assert.equal(h.calls.length,0);flow.dismissStopped();assert.equal(flow.state.pending,null);
 h.services.inspect=async()=>({status:'completed'});h.services.content=async()=>{throw Object.assign(new Error('expired'),{status:404});};await flow.recover({id:jobId,key,operation:'export',status:'completed'});assert.equal(flow.state.status,'expired');assert.ok(flow.state.pending);flow.dismissStopped();assert.equal(flow.state.pending,null);flow.dispose();
});
test('HIS-005 account change/unmount ignores late POST, lookup and download responses',async()=>{
 const h=harness('account'),post=deferred<{jobId:string}>();h.services.create=async()=>post.promise;const flow=h.flow();await flow.restore();const start=flow.start('export');flow.dispose();post.resolve({jobId});await start;assert.equal(h.saved()?.id,'');assert.equal(h.downloads.length,0);
 const other=harness('account'),content=deferred<unknown>();other.services.store({id:jobId,key,operation:'export'});other.setStatus('completed');other.services.content=async()=>content.promise;const old=other.flow();await old.restore();const checking=old.check();await Promise.resolve();old.dispose();content.resolve({private:'old account'});await checking;assert.equal(other.downloads.length,0);assert.ok(other.saved());
});
test('HIS-005 definite rejections clear intents while completed prior jobs remain recoverable without automatic actions',async()=>{
 const h=harness('account');h.services.create=async()=>{throw Object.assign(new Error('Invalid request'),{status:400});};h.setJobs([{id:jobId,key:'older-request-key',operation:'export',status:'completed'}]);const flow=h.flow();await flow.restore();assert.equal(flow.state.pending,null);assert.equal(flow.state.recoverable.length,1);assert.equal(h.downloads.length,0);await flow.start('export');assert.equal(h.saved(),null);assert.equal(flow.state.status,'idle');flow.dispose();
});
test('HIS-005/AUT-008 server-rendered controls await owner recovery and describe explicit export/deletion actions',()=>{
 const account=renderToStaticMarkup(<CloudDataControls ownerId={owner}/>);assert.match(account,/Request account export/);assert.match(account,/Confirm account deletion/);assert.match(account,/disabled/);
 const history=renderToStaticMarkup(<HistoryBatchControls ownerId={owner} runIds={['private-id']} onDeleted={()=>{}}/>);assert.match(history,/Export loaded history/);assert.match(history,/I want to delete/);assert.equal(history.includes('private-id'),false);
 const versions=renderToStaticMarkup(<ResultVersionList runId={jobId} revision={1}/>);assert.match(versions,/Result versions \(0\)/);
});
