import test from 'node:test';
import assert from 'node:assert/strict';
import {AssistantActivity,mergeChatMessages,decodeAssistantAttachment} from '../lib/assistant-session';

function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(done=>{resolve=done;});return {promise,resolve};}

test('CHT-003 a late restore or stream callback cannot replace a newer selected session',async()=>{
 const session=new AssistantActivity(),old=deferred<string>(),next=deferred<string>();let visible='';
 const a=session.begin();const finishOld=old.promise.then(value=>{if(session.current(a))visible=value;});
 const b=session.begin();const finishNext=next.promise.then(value=>{if(session.current(b))visible=value;});
 assert.equal(a.signal.aborted,true);assert.equal(session.pending,true);
 next.resolve('selected B');await finishNext;old.resolve('late A');await finishOld;assert.equal(visible,'selected B');
 session.finish(a);assert.equal(session.pending,true);session.finish(b);assert.equal(session.pending,false);
});
test('CHT-003 clear/stop invalidates even a transport which ignores abort, including captured cursor pages',async()=>{
 const session=new AssistantActivity(),request=session.begin(),page=session.capture(),late=deferred<string>();let content='New chat';
 const pending=late.promise.then(value=>{if(session.current(request)||session.current(page))content=value;});session.stop();
 assert.equal(request.signal.aborted,true);assert.equal(session.current(page),false);late.resolve('previous thread');await pending;assert.equal(content,'New chat');
 const fresh=session.begin();assert.equal(session.current(fresh),true);assert.equal(session.current(request),false);
});
test('CHT-003 overlapping older-message pages preserve order and prefer the current streamed copy',()=>{
 const old=[{id:'one',content:'oldest'},{id:'two',content:'stale stream'}];
 const current=[{id:'two',content:'complete stream'},{id:'three',content:'newest'}];
 assert.deepEqual(mergeChatMessages(old,current),[{id:'one',content:'oldest'},{id:'two',content:'complete stream'},{id:'three',content:'newest'}]);
 assert.equal(mergeChatMessages(old,current).length,3);assert.equal(old[1].content,'stale stream');
});
test('CHT-005 invalid UTF-8, binary controls and oversized attachments fail with actionable errors',()=>{
 assert.throws(()=>decodeAssistantAttachment(new Uint8Array([0xc3,0x28]).buffer),/valid UTF-8/);
 for(const value of ['hello\u0000world','hello\u0001world'])assert.throws(()=>decodeAssistantAttachment(new TextEncoder().encode(value).buffer),/text or code/);
 assert.throws(()=>decodeAssistantAttachment(new Uint8Array(100001).buffer),/100 KB/);
});
test('CHT-005 local attachment truncation counts Unicode points and preserves text line breaks',()=>{
 const source='😀'.repeat(3001);assert.equal(decodeAssistantAttachment(new TextEncoder().encode(source).buffer),'😀'.repeat(3000));
 const text='line 1\r\n\tline 2';assert.equal(decodeAssistantAttachment(new TextEncoder().encode(text).buffer),text);
});
