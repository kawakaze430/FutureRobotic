import {createHash,sign,verify,randomUUID} from 'node:crypto';
export const languages=['Python','JavaScript','C','C++','Java'];
export const limits={characters:10000,stdinBytes:10000,wallMs:10000,memoryBytes:536870912,pids:64,outputBytes:65536,diskBytes:67108864};
export const sha=source=>createHash('sha256').update(source).digest('hex');
export function validateJob(job){if(!job||!/^[-a-f0-9]{36}$/.test(job.id)||!languages.includes(job.language)||typeof job.source!=='string'||Array.from(job.source).length>limits.characters||Buffer.byteLength(job.source)>40000||typeof job.stdin!=='string'||Buffer.byteLength(job.stdin)>limits.stdinBytes)throw new Error('INVALID_EXECUTION_JOB');return job;}
export function signCapability(job,privateKey){validateJob(job);const body=Buffer.from(JSON.stringify({aud:'fr-isolated-runner',id:job.id,sha256:sha(job.source),stdinSha256:sha(job.stdin),language:job.language,expiresAt:Date.now()+60000,nonce:randomUUID()})).toString('base64url');return body+'.'+sign(null,Buffer.from(body),privateKey).toString('base64url');}
export function verifyCapability(value,job,publicKey,seen=new Map()){
 validateJob(job);if(typeof value!=='string'||value.length>3000)throw new Error('INVALID_CAPABILITY');const [body,signature,...extra]=value.split('.');
 if(extra.length||!body||!signature||!verify(null,Buffer.from(body),publicKey,Buffer.from(signature,'base64url')))throw new Error('INVALID_CAPABILITY');
 const claims=JSON.parse(Buffer.from(body,'base64url').toString());
 if(claims.aud!=='fr-isolated-runner'||claims.id!==job.id||claims.sha256!==sha(job.source)||claims.stdinSha256!==sha(job.stdin)||claims.language!==job.language||claims.expiresAt<Date.now()||claims.expiresAt>Date.now()+61000||typeof claims.nonce!=='string')throw new Error('INVALID_CAPABILITY');
 for(const [key,expiry]of seen)if(expiry<Date.now())seen.delete(key);if(seen.size>=10000||seen.has(claims.nonce))throw new Error('CAPABILITY_REPLAY');seen.set(claims.nonce,claims.expiresAt);return claims;
}
export function containerArgs(job,imageDigest){validateJob(job);if(!/^[a-z0-9./:_-]+@sha256:[a-f0-9]{64}$/.test(imageDigest))throw new Error('PINNED_RUNNER_IMAGE_REQUIRED');return ['run','--rm','--name',`frjob-${job.id}`,'--runtime=runsc','--network=none','--read-only','--cap-drop=ALL','--security-opt=no-new-privileges:true','--pids-limit=64','--memory=512m','--memory-swap=512m','--cpus=1','--user=10001:10001','--ipc=none','--ulimit','nofile=64:64','--tmpfs','/work:rw,exec,nosuid,nodev,size=64m,uid=10001,gid=10001','--tmpfs','/tmp:rw,noexec,nosuid,nodev,size=16m,uid=10001,gid=10001','-i',imageDigest];}
