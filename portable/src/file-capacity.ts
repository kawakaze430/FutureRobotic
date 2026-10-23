import type {Db} from './db.js';
import {fail,lock,type Principal} from './common.js';
import {planCatalog,supportedTextExtensions,excludedFile} from './product-policy.js';
export function validTextName(name:string){
 const extension=name.split('.').at(-1)?.toLowerCase()??'';
 return !!name&&name.length<=200&&!/[\\/\x00-\x1f]/.test(name)&&!excludedFile(name)&&supportedTextExtensions.has(extension);
}
export function validTextContent(content:string){return !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(content)&&Buffer.byteLength(content)<=100000;}
export async function fileUsage(tx:Db,p:Principal){
 const sub=await tx.query("SELECT plan_id FROM subscriptions WHERE workspace_id=$1 AND owner_id=$2 AND status IN('active','trialing') AND period_start<=now() AND period_end>now() ORDER BY last_event_at DESC LIMIT 1",[p.workspaceId,p.userId]);
 const plan=planCatalog.find(v=>v.id===sub.rows[0]?.plan_id)??planCatalog[0];
 const count=await tx.query("SELECT count(*)::int AS n FROM files WHERE workspace_id=$1 AND owner_id=$2 AND status<>'deleted'",[p.workspaceId,p.userId]);
 const bytes=await tx.query("SELECT coalesce(sum(r.size_bytes),0) AS n FROM file_revisions r JOIN files f ON f.id=r.file_id WHERE f.workspace_id=$1 AND f.owner_id=$2 AND f.status<>'deleted'",[p.workspaceId,p.userId]);
 return {plan:plan.id,count:count.rows[0].n as number,bytes:Number(bytes.rows[0].n),fileLimit:plan.fileLimit,byteLimit:plan.fileLimit*100000,maxFileBytes:100000,maxRevisions:20};
}
// Every capacity-changing path holds the same transaction lock, including staged uploads.
export async function reserveFileCapacity(tx:Db,p:Principal,bytes:number,newFiles=1){
 await lock(tx,`files-capacity:${p.workspaceId}`);
 const usage=await fileUsage(tx,p);
 if(usage.count+newFiles>usage.fileLimit)fail('FILE_COUNT_LIMIT',402);
 if(usage.bytes+bytes>usage.byteLimit)fail('FILE_STORAGE_LIMIT',413);
 return usage;
}
