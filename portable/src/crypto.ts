import {createCipheriv,createDecipheriv,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {fail} from './common.js';
export class Sealer {
 private key:Buffer;
 constructor(key:string){this.key=Buffer.from(key,'base64');if(this.key.length!==32)throw new Error('APP_ENCRYPTION_KEY must encode exactly 32 random bytes');}
 seal(value:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',this.key,iv);const bytes=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),bytes]).toString('base64url');}
 open(value:string){try{const bytes=Buffer.from(value,'base64url');const cipher=createDecipheriv('aes-256-gcm',this.key,bytes.subarray(0,12));cipher.setAuthTag(bytes.subarray(12,28));return Buffer.concat([cipher.update(bytes.subarray(28)),cipher.final()]).toString('utf8');}catch{return fail('ENCRYPTED_VALUE_INVALID',503);}}
}
export const mac=(secret:string,value:string)=>createHmac('sha256',secret).update(value).digest('hex');
export function constantEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function totp(secret:Buffer,step:number){const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(step));const digest=createHmac('sha1',secret).update(counter).digest();const offset=digest[digest.length-1]&15;return ((digest.readUInt32BE(offset)&0x7fffffff)%1000000).toString().padStart(6,'0');}
