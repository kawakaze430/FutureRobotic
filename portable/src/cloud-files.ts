import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import {S3Client,PutObjectCommand,GetObjectCommand,HeadObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {SESv2Client,SendEmailCommand} from '@aws-sdk/client-sesv2';
import type {Db} from './db.js';
import type {ObjectStore} from './content.js';
import type {Mailer} from './public-auth.js';
import {fail,hash,id,iso,scope,type Principal} from './common.js';
import {inspectZip,crc32} from './project-archive.js';
import {excludedFile,supportedTextExtensions} from './product-policy.js';
import {reserveFileCapacity,validTextName} from './file-capacity.js';
import {enqueue} from './jobs.js';
const digest=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
export class S3Objects implements ObjectStore {
 constructor(private client:S3Client,readonly bucket:string,private kmsKey:string){if(!bucket||!kmsKey)throw new Error('Private S3 bucket and KMS key are required');}
 private key(key:string){if(!/^[a-z0-9/-]{1,200}$/.test(key)||key.includes('..'))fail('INVALID_OBJECT_KEY');return key;}
 async put(key:string,bytes:Uint8Array){await this.client.send(new PutObjectCommand({Bucket:this.bucket,Key:this.key(key),Body:bytes,ChecksumSHA256:Buffer.from(digest(bytes),'hex').toString('base64'),ServerSideEncryption:'aws:kms',SSEKMSKeyId:this.kmsKey,ContentType:'text/plain; charset=utf-8'}));}
 async get(key:string){const r=await this.client.send(new GetObjectCommand({Bucket:this.bucket,Key:this.key(key)}));if(!r.Body||Number(r.ContentLength)>2000000)return fail('OBJECT_TOO_LARGE',413);const chunks:Uint8Array[]=[];let length=0;for await(const chunk of r.Body as AsyncIterable<Uint8Array>){length+=chunk.length;if(length>2000000){(r.Body as any).destroy?.();return fail('OBJECT_TOO_LARGE',413);}chunks.push(chunk);}return Buffer.concat(chunks);}
 async delete(key:string){await this.client.send(new DeleteObjectCommand({Bucket:this.bucket,Key:this.key(key)}));}
 async uploadUrl(key:string,size:number,sha256:string){
  const command=new PutObjectCommand({Bucket:this.bucket,Key:this.key(key),ContentLength:size,ChecksumSHA256:Buffer.from(sha256,'hex').toString('base64'),ContentType:'application/octet-stream',ServerSideEncryption:'aws:kms',SSEKMSKeyId:this.kmsKey});
  return {url:await getSignedUrl(this.client,command,{expiresIn:300}),headers:{'content-type':'application/octet-stream','x-amz-checksum-sha256':Buffer.from(sha256,'hex').toString('base64'),'x-amz-server-side-encryption':'aws:kms','x-amz-server-side-encryption-aws-kms-key-id':this.kmsKey},expiresIn:300};
 }
 async verify(key:string,size:number,sha256:string){const r=await this.client.send(new HeadObjectCommand({Bucket:this.bucket,Key:this.key(key),ChecksumMode:'ENABLED'}));if(r.ContentLength!==size||r.ChecksumSHA256!==Buffer.from(sha256,'hex').toString('base64')||r.ServerSideEncryption!=='aws:kms')fail('UPLOAD_INTEGRITY_FAILURE');}
}
export class SesMailer implements Mailer {
 constructor(private client:SESv2Client,private from:string){}
 async sendCode(email:string,code:string){await this.client.send(new SendEmailCommand({FromEmailAddress:this.from,Destination:{ToAddresses:[email]},Content:{Simple:{Subject:{Data:'Your FutureRobotic AI sign-in code'},Body:{Text:{Data:`Your one-time code is ${code}. It expires in 10 minutes. If you did not request this code, ignore this email.`}}}}}));}
}
export function extractProject(bytes:Uint8Array){
 const files:{name:string;content:string}[]=[],excluded:string[]=[];
 for(const entry of inspectZip(bytes)){
  if(entry.excluded){excluded.push(entry.name);continue;}
  const expanded=entry.method===0?entry.bytes:inflateRawSync(entry.bytes,{maxOutputLength:entry.size+1});
  if(expanded.length!==entry.size||crc32(expanded)!==entry.crc)fail('ARCHIVE_INTEGRITY_FAILURE');
  const text=new TextDecoder('utf-8',{fatal:true}).decode(expanded);if(text.includes('\0'))fail('BINARY_CONTEXT_REJECTED');files.push({name:entry.name,content:text});
 }return {files,excluded};
}
export class QuarantineService {
 constructor(private db:Db,private objects:S3Objects){}
 async begin(p:Principal,name:string,size:number,sha256:string){
  if(!validTextName(name)||!Number.isSafeInteger(size)||size<1||size>100000||!/^[a-f0-9]{64}$/.test(sha256))fail('INVALID_UPLOAD');
  const fileId=id(),revisionId=id(),key=`quarantine/${p.workspaceId}/${revisionId}`;
  await this.db.transaction(async tx=>{
   await scope(tx,p);await reserveFileCapacity(tx,p,size);
   await tx.query('INSERT INTO files(id,workspace_id,owner_id,name,status) VALUES($1,$2,$3,$4,\'staged\')',[fileId,p.workspaceId,p.userId,name]);
   await tx.query('INSERT INTO file_revisions(id,file_id,workspace_id,owner_id,revision,object_key,sha256,size_bytes,media_type) VALUES($1,$2,$3,$4,1,$5,$6,$7,\'text/plain\')',[revisionId,fileId,p.workspaceId,p.userId,key,sha256,size]);
   await tx.query('INSERT INTO quarantine_uploads(file_id,revision_id,expected_sha256,expected_bytes,object_key,expires_at) VALUES($1,$2,$3,$4,$5,$6)',[fileId,revisionId,sha256,size,key,iso(Date.now()+600000)]);
  });return {id:fileId,...await this.objects.uploadUrl(key,size,sha256)};
 }
 async complete(p:Principal,fileId:string){
  await scope(this.db,p);
  const r=await this.db.query('SELECT q.* FROM quarantine_uploads q JOIN files f ON f.id=q.file_id WHERE q.file_id=$1 AND f.workspace_id=$2 AND f.owner_id=$3 AND f.status<>\'deleted\'',[fileId,p.workspaceId,p.userId]);const q=r.rows[0];
  if(!q||new Date(q.expires_at).getTime()<=Date.now())fail('UPLOAD_EXPIRED',410);
  await this.objects.verify(q.object_key,Number(q.expected_bytes),q.expected_sha256);
  await this.db.transaction(async tx=>{await tx.query('UPDATE quarantine_uploads SET completed_at=coalesce(completed_at,now()) WHERE file_id=$1',[fileId]);await enqueue(tx,'extract_text',`extract:${q.revision_id}`,{fileId},'extract');});return {id:fileId,status:'quarantined'};
 }
}
export async function extractQuarantine(db:Db,objects:ObjectStore,fileId:string){
 const r=await db.query('SELECT q.*,f.status FROM quarantine_uploads q JOIN files f ON f.id=q.file_id WHERE f.id=$1',[fileId]);const q=r.rows[0];if(!q||q.status==='deleted'||q.status==='ready')return;if(!q.completed_at)fail('UPLOAD_NOT_COMPLETED',409);
 const bytes=await objects.get(q.object_key);
 if(bytes.length!==Number(q.expected_bytes)||digest(bytes)!==q.expected_sha256)fail('UPLOAD_INTEGRITY_FAILURE');
 const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(text.includes('\0'))fail('BINARY_CONTEXT_REJECTED');
 const promoted=`text/${q.revision_id}`;await objects.put(promoted,bytes);
 await db.transaction(async tx=>{
  const f=await tx.query('SELECT status FROM files WHERE id=$1 FOR UPDATE',[fileId]);
  if(f.rows[0]?.status==='deleted'){await enqueue(tx,'delete_object',`delete:${promoted}`,{objectKey:promoted},'extract');return;}
  await tx.query('UPDATE file_revisions SET extracted_text=$2,extraction_status=\'ready\',object_key=$3 WHERE id=$1',[q.revision_id,text,promoted]);await tx.query('UPDATE files SET status=\'ready\' WHERE id=$1',[fileId]);
  await enqueue(tx,'delete_object',`delete:${q.object_key}`,{objectKey:q.object_key},'extract');
 });
}
