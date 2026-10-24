import test from 'node:test';
import assert from 'node:assert/strict';
import {ResultNoteQueue,SelectionEpoch,workspaceTool,jobStorageKey,readPendingJob,storePendingJob} from '../lib/workspace-session';

function deferred<T>() {
 let resolve!:(value:T)=>void;
 const promise=new Promise<T>(r=>{resolve=r;});
 return {promise,resolve};
}

test('WRK-006 note saves serialize per result and use the version returned by its own previous write',async()=>{
 const first=deferred<{version:number}>(),calls:{id:string;content:string;version:number|null}[]=[];
 const queue=new ResultNoteQueue(async(id,content,version)=>{calls.push({id,content,version});return content==='first'?first.promise:{version:(version??0)+1};});
 queue.remember('a','',null);queue.remember('b','other',9);
 const a=queue.save('a','first'),a2=queue.save('a','second'),b=queue.save('b','separate');
 await b;assert.deepEqual(calls,[{id:'a',content:'first',version:null},{id:'b',content:'separate',version:9}]);
 first.resolve({version:1});await Promise.all([a,a2]);
 assert.deepEqual(calls.at(-1),{id:'a',content:'second',version:1});
 assert.equal(queue.state('a')?.version,2);assert.equal(queue.state('b')?.version,10);
 assert.equal(queue.state('a')?.draft,'second');
});

test('WRK-006 a conflicting note keeps its draft and blocks automatic overwrite until explicit reload',async()=>{
 let calls=0;const conflict=new Error('VERSION_CONFLICT');
 const queue=new ResultNoteQueue(async()=>{calls++;throw conflict;});queue.remember('a','saved',3);
 await assert.rejects(queue.save('a','unsaved'),conflict);queue.edit('a','newer draft');
 await assert.rejects(queue.save('a','newer draft'),conflict);assert.equal(calls,1);
 assert.equal(queue.state('a')?.draft,'newer draft');assert.equal(queue.state('a')?.saved,'saved');
 queue.remember('a','external version',4);assert.equal(queue.state('a')?.blocked,null);
});

test('WRK-006 queued writes are invalidated when accounts change',async()=>{
 const gate=deferred<{version:number}>();let calls=0;
 const queue=new ResultNoteQueue(async()=>{calls++;return gate.promise;});queue.remember('a','',null);
 const active=queue.save('a','first');await Promise.resolve();const queued=queue.save('a','second');
 queue.clear();gate.resolve({version:1});await active;await assert.rejects(queued,{name:'AbortError'});
 assert.equal(calls,1);assert.equal(queue.state('a'),undefined);
});

test('HIS-003 selection epochs reject out-of-order reads even when transport ignores abort',()=>{
 const selection=new SelectionEpoch(),old=selection.next(),current=selection.next();
 assert.equal(selection.current(old),false);assert.equal(selection.current(current),true);
 selection.next();assert.equal(selection.current(current),false);
 assert.equal(workspaceTool('review'),'check');assert.equal(workspaceTool('chat'),'explain');
});

test('AUT-008 history/account recovery metadata is owner scoped and tolerates blocked or invalid storage',()=>{
 const values=new Map<string,string>();const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);},removeItem:(key:string)=>{values.delete(key);}};
 const intent={id:'',key:'safe-request-key',operation:'export' as const};
 storePendingJob(storage,'a','account',intent);assert.deepEqual(readPendingJob(storage,'a','account'),intent);
 assert.equal(readPendingJob(storage,'b','account'),null);assert.equal(readPendingJob(storage,'a','history'),null);
 values.set(jobStorageKey('a','account'),JSON.stringify({...intent,key:'bad'}));assert.equal(readPendingJob(storage,'a','account'),null);
 values.set(jobStorageKey('a','account'),'[malformed');assert.equal(readPendingJob(storage,'a','account'),null);
 assert.doesNotThrow(()=>storePendingJob({setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}},'a','account',intent));
 storePendingJob(storage,'a','account',null);assert.equal(values.has(jobStorageKey('a','account')),false);
});
