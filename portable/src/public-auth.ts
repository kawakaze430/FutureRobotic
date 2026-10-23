import {createHash,randomInt} from 'node:crypto';
import {createRemoteJWKSet,jwtVerify} from 'jose';
import type {Db} from './db.js';
import {AppError,fail,hash,id,iso,lock,token} from './common.js';
import {IdentityService,type VerifiedIdentity} from './identity.js';
import {QuotaService} from './quota.js';
import {Sealer,mac,constantEqual} from './crypto.js';
export interface Mailer {sendCode(email:string,code:string):Promise<void>}
export interface HumanVerifier {verify(token:string,ip:string):Promise<boolean>}
export async function boundedJson(response:Response,max=100000){
 if(!response.body)return fail('UPSTREAM_UNAVAILABLE',503);const reader=response.body.getReader();let size=0;const chunks:Uint8Array[]=[];
 try{for(;;){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>max)return fail('UPSTREAM_RESPONSE_TOO_LARGE',503);chunks.push(r.value);}}finally{await reader.cancel().catch(()=>{});}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return fail('UPSTREAM_INVALID_RESPONSE',503);}
}
export class TurnstileVerifier implements HumanVerifier {
 constructor(private secret:string,private host:string,private http:typeof fetch=fetch){}
 async verify(value:string,ip:string){if(!this.secret||value.length>2048)return false;try{const r=await this.http('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:this.secret,response:value,remoteip:ip}),signal:AbortSignal.timeout(5000)});const data=await boundedJson(r);return data.success===true&&data.hostname===this.host&&data.action==='login';}catch{return false;}}
}
export class AuthLimits {
 constructor(private db:Db,private secret:string){if(secret.length<32)throw new Error('AUTH_HASH_SECRET must have at least 32 characters');}
 async take(subject:string,operation:string,max:number,windowSeconds=600){
  const subjectHash=mac(this.secret,subject),start=iso(Math.floor(Date.now()/(windowSeconds*1000))*windowSeconds*1000);
  const r=await this.db.query('INSERT INTO auth_windows(subject_hash,operation,window_start) VALUES($1,$2,$3) ON CONFLICT(subject_hash,operation,window_start) DO UPDATE SET hits=auth_windows.hits+1 RETURNING hits',[subjectHash,operation,start]);
  if(r.rows[0].hits>max)fail('AUTH_RATE_LIMIT',429);
 }
}
export interface OAuthClient {id:string;secret:string}
export interface AuthOptions {origin:string;hashSecret:string;sealer:Sealer;mailer?:Mailer;human?:HumanVerifier;google?:OAuthClient;github?:OAuthClient;http?:typeof fetch;googleVerify?:(jwt:string,nonce:string,audience:string)=>Promise<VerifiedIdentity>}
export class PublicAuth {
 limits:AuthLimits;private identity:IdentityService;private http:typeof fetch;
 constructor(private db:Db,private options:AuthOptions){this.identity=new IdentityService(db);this.limits=new AuthLimits(db,options.hashSecret);this.http=options.http??fetch;}
 providers(){return {google:!!this.options.google,github:!!this.options.github,email:!!this.options.mailer&&!!this.options.human};}
 async requestOtp(email:string,humanToken:string,ip:string){
  email=email.trim().toLowerCase();if(!/^[^@\s]{1,100}@[^@\s]{1,150}\.[^@\s]+$/.test(email)||email.length>254)fail('INVALID_EMAIL');
  await this.limits.take(ip,'otp-ip',10);await this.limits.take(email,'otp-email',3);
  if(!this.options.mailer||!this.options.human)fail('EMAIL_LOGIN_NOT_CONFIGURED',503);
  if(!await this.options.human!.verify(humanToken,ip))fail('HUMAN_VERIFICATION_FAILED',403);
  const challengeId=id(),code=randomInt(0,1000000).toString().padStart(6,'0');
  await this.db.transaction(async tx=>{
   await tx.query('DELETE FROM bot_token_uses WHERE expires_at<=now()');
   const used=await tx.query('INSERT INTO bot_token_uses(token_hash,expires_at) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING token_hash',[hash(humanToken),iso(Date.now()+600000)]);
   if(!used.rowCount)fail('HUMAN_TOKEN_REPLAY',403);
   await tx.query('INSERT INTO otp_challenges(id,email,code_hash,expires_at,status) VALUES($1,$2,$3,$4,\'pending\')',[challengeId,email,mac(this.options.hashSecret,`${challengeId}:${email}:${code}`),iso(Date.now()+600000)]);
  });
  try{await this.options.mailer!.sendCode(email,code);await this.db.query('UPDATE otp_challenges SET status=\'sent\' WHERE id=$1',[challengeId]);}
  catch{await this.db.query('UPDATE otp_challenges SET status=\'failed\' WHERE id=$1',[challengeId]);fail('EMAIL_DELIVERY_UNAVAILABLE',503);}
  return {challengeId,expiresIn:600};
 }
 async verifyOtp(challengeId:string,code:string,ip:string){
  await this.limits.take(ip,'otp-verify',30);
  const result=await this.db.transaction(async tx=>{
   const r=await tx.query('SELECT * FROM otp_challenges WHERE id=$1 FOR UPDATE',[challengeId]);const c=r.rows[0];
   if(!c||c.status!=='sent'||new Date(c.expires_at).getTime()<=Date.now()||c.attempts>=5)return {error:true};
   const valid=/^\d{6}$/.test(code)&&constantEqual(c.code_hash,mac(this.options.hashSecret,`${challengeId}:${c.email}:${code}`));
   await tx.query('UPDATE otp_challenges SET attempts=attempts+1,status=$2 WHERE id=$1',[challengeId,valid?'consumed':c.attempts+1>=5?'locked':'sent']);
   return valid?{email:c.email as string}:{error:true};
  });
  if(!result.email) return fail('INVALID_OR_EXPIRED_CODE',401);
  return this.session({issuer:'email',subject:result.email,email:result.email,emailVerified:true});
 }
 async begin(provider:'google'|'github',ip:string){
  await this.limits.take(ip,'oauth-start',20);const config=this.options[provider];if(!config)return fail('OAUTH_NOT_CONFIGURED',503);
  const state=token(),binding=token(),verifier=token(),nonce=token();
  await this.db.query('INSERT INTO auth_states(id,provider,binding_hash,verifier_cipher,nonce,expires_at) VALUES($1,$2,$3,$4,$5,$6)',[hash(state),provider,hash(binding),this.options.sealer.seal(verifier),nonce,iso(Date.now()+600000)]);
  const url=new URL(provider==='google'?'https://accounts.google.com/o/oauth2/v2/auth':'https://github.com/login/oauth/authorize');
  const values={client_id:config.id,redirect_uri:`${this.options.origin}/auth/${provider}/callback`,response_type:'code',scope:provider==='google'?'openid email profile':'read:user user:email',state,nonce,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'};
  for(const [k,v]of Object.entries(values))url.searchParams.set(k,v);return {url:url.toString(),binding};
 }
 async callback(provider:'google'|'github',state:string,code:string,binding:string){
  const config=this.options[provider];if(!config||!state||!binding||code.length>2000)return fail('INVALID_OAUTH_CALLBACK',401);
  const authState=await this.db.transaction(async tx=>{
   const r=await tx.query('SELECT * FROM auth_states WHERE id=$1 AND provider=$2 FOR UPDATE',[hash(state),provider]);const row=r.rows[0];
   if(!row||row.consumed_at||new Date(row.expires_at).getTime()<=Date.now()||!constantEqual(row.binding_hash,hash(binding)))return fail('INVALID_OAUTH_STATE',401);
   await tx.query('UPDATE auth_states SET consumed_at=now() WHERE id=$1',[hash(state)]);return row;
  });
  const response=await this.http(provider==='google'?'https://oauth2.googleapis.com/token':'https://github.com/login/oauth/access_token',{method:'POST',headers:{accept:'application/json','content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:config.id,client_secret:config.secret,code,redirect_uri:`${this.options.origin}/auth/${provider}/callback`,grant_type:'authorization_code',code_verifier:this.options.sealer.open(authState.verifier_cipher)}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)return fail('OAUTH_EXCHANGE_FAILED',401);const data=await boundedJson(response);
  let identity:VerifiedIdentity;
  if(provider==='google'){
   if(typeof data.id_token!=='string')return fail('INVALID_ID_TOKEN',401);
   if(this.options.googleVerify) identity=await this.options.googleVerify(data.id_token,authState.nonce,config.id);
   else{
    const {payload}=await jwtVerify(data.id_token,createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs')),{issuer:['https://accounts.google.com','accounts.google.com'],audience:config.id,algorithms:['RS256'],maxTokenAge:'10m'});
    if(payload.nonce!==authState.nonce||payload.email_verified!==true||typeof payload.email!=='string'||!payload.sub)return fail('UNVERIFIED_IDENTITY',401);
    identity={issuer:'google',subject:payload.sub,email:payload.email,emailVerified:true};
   }
  }else{
   if(typeof data.access_token!=='string')return fail('OAUTH_EXCHANGE_FAILED',401);
   const headers={authorization:`Bearer ${data.access_token}`,accept:'application/vnd.github+json','user-agent':'FutureRobotic-AI'};
   const user=await this.http('https://api.github.com/user',{headers,signal:AbortSignal.timeout(10000)}),emails=await this.http('https://api.github.com/user/emails',{headers,signal:AbortSignal.timeout(10000)});
   if(!user.ok||!emails.ok)return fail('OAUTH_PROFILE_FAILED',401);
   const u=await boundedJson(user),list=await boundedJson(emails),email=Array.isArray(list)?list.find((e:any)=>e.primary===true&&e.verified===true):null;
   if(!email||!Number.isSafeInteger(u.id))return fail('UNVERIFIED_IDENTITY',401);identity={issuer:'github',subject:String(u.id),email:email.email,emailVerified:true};
  }
  return this.session(identity);
 }
 private async session(claim:VerifiedIdentity){const p=await this.identity.establish(claim);await new QuotaService(this.db).grantStarter(p);return this.identity.createSession(p.userId);}
}
