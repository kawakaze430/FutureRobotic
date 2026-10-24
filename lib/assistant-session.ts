import {SelectionEpoch} from './workspace-session';
import {takeCharacters} from './input-policy';

export interface AssistantRequest {token:number;signal:AbortSignal}

/** Session changes invalidate work even when an upstream read ignores abort. */
export class AssistantActivity {
 private epoch=new SelectionEpoch();
 private controller:AbortController|null=null;
 get pending(){return this.controller!==null;}
 capture(){return this.epoch.capture();}
 current(request:number|AssistantRequest){return typeof request==='number'?this.epoch.current(request):this.epoch.current(request.token)&&!request.signal.aborted;}
 stop(){this.controller?.abort();this.controller=null;this.epoch.next();}
 begin():AssistantRequest {this.stop();this.controller=new AbortController();return {token:this.epoch.capture(),signal:this.controller.signal};}
 finish(request:AssistantRequest){if(this.current(request))this.controller=null;}
}

/** Stable cursor pages can overlap after retries; the current copy wins. */
export function mergeChatMessages<T extends {id:string|number}>(earlier:T[],current:T[]):T[]{
 return [...new Map([...earlier,...current].map(message=>[message.id,message])).values()];
}

export function decodeAssistantAttachment(bytes:ArrayBuffer):string {
 if(bytes.byteLength>100000)throw new Error('Attach a text or code file smaller than 100 KB.');
 let content:string;
 try{content=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new Error('This attachment must contain valid UTF-8 text.');}
 if(/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(content))throw new Error('This attachment must be a text or code file.');
 return takeCharacters(content,3000);
}
