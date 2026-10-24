#!/usr/bin/env node
// Run only in an owner-controlled admin/migration task, never the API container.
// Secrets are accepted through protected environment settings/files, not argv.
import {constants} from 'node:fs';
import {open,lstat,readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {Postgres} from '../dist/src/db.js';
import {Sealer} from '../dist/src/crypto.js';
import {OperatorAdminService} from '../dist/src/operator-admin.js';

function argumentsOf(argv){
 const [command,...rest]=argv;const options={};
 for(let i=0;i<rest.length;i+=2){const key=rest[i],value=rest[i+1];if(!/^--[a-z-]+$/.test(key??'')||value===undefined||value.startsWith('--')||Object.hasOwn(options,key))throw Error('Invalid or duplicated option');options[key]=value;}
 return {command,options};
}
function base32(bytes){let bits=0,value=0,result='';for(const byte of bytes){value=(value<<8)|byte;bits+=8;while(bits>=5){result+='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[(value>>>(bits-5))&31];bits-=5;}}if(bits)result+='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[(value<<(5-bits))&31];return result;}
async function protectedJson(path){
 const stat=await lstat(path);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096||(stat.mode&0o077)!==0||(process.getuid&&stat.uid!==process.getuid()))throw Error('Seed file must be an owned regular file with mode0600');
 const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);try{return JSON.parse(await file.readFile('utf8'));}finally{await file.close();}
}
let db;
try{
 const {command,options}=argumentsOf(process.argv.slice(2));
 if(command==='generate-seed'){
  if(Object.keys(options).some(key=>!['--output','--label'].includes(key))||!options['--output'])throw Error('Usage: generate-seed --output protected-new-file [--label operator-user-id]');
  const label=options['--label']??'operator';if(label.length>200||/[\u0000-\u001f]/.test(label))throw Error('Invalid label');
  const seed=randomBytes(20),otpauthUri=`otpauth://totp/${encodeURIComponent('FutureRobotic:'+label)}?secret=${base32(seed)}&issuer=FutureRobotic&algorithm=SHA1&digits=6&period=30`;
  const file=await open(options['--output'],constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
  try{await file.writeFile(JSON.stringify({schemaVersion:1,seedBase64:seed.toString('base64'),otpauthUri})+'\n');await file.sync();}finally{await file.close();seed.fill(0);}
  console.log('Protected authenticator seed file created. Import its URI using the protected operator provisioning channel; no secret was printed.');
 }else{
  if(!['enroll','rotate','revoke'].includes(command))throw Error('Commands: generate-seed, enroll, rotate, revoke');
  if(Object.keys(options).some(key=>!['--user','--role','--seed-file','--expected-version','--request-key','--reason'].includes(key)))throw Error('Unknown management option');
  if(process.env.OPERATOR_ADMIN_AUTHORIZED!=='true'||!process.env.OPERATOR_ADMIN_DATABASE_URL||!process.env.APP_ENCRYPTION_KEY||!process.env.PG_CA_FILE)throw Error('Protected operator-admin authorization, distinct admin DB, encryption key and trusted PG CA are required');
  if(process.env.OPERATOR_ADMIN_DATABASE_URL===process.env.DATABASE_URL)throw Error('Operator management must use a separate protected admin credential');
  const url=new URL(process.env.OPERATOR_ADMIN_DATABASE_URL);if(!['postgres:','postgresql:'].includes(url.protocol)||['sslmode','ssl','sslrootcert'].some(key=>url.searchParams.has(key)))throw Error('Use a PostgreSQL admin URL without TLS overrides');
  const seed=command==='revoke'?undefined:await protectedJson(options['--seed-file']);
  db=new Postgres({connectionString:url.toString(),max:1,ssl:{rejectUnauthorized:true,ca:await readFile(process.env.PG_CA_FILE,'utf8')}});
  const service=new OperatorAdminService(db,new Sealer(process.env.APP_ENCRYPTION_KEY));
  const result=await service.manage({action:command,userId:options['--user'],role:options['--role'],secretBase64:seed?.seedBase64,expectedVersion:options['--expected-version']===undefined?undefined:Number(options['--expected-version']),requestKey:options['--request-key']??'',reason:options['--reason']??''});
  console.log(JSON.stringify(result));
 }
}catch(error){
 // Database/lib errors can contain addresses/credentials; emit only known safe codes.
 const code=typeof error?.code==='string'&&/^[A-Z_]{3,80}$/.test(error.code)?error.code:'OPERATOR_ADMIN_FAILED';
 console.error(code+'. Check protected configuration, expected version, seed-file permissions and admin-role grants. No secret or database URL is printed.');process.exitCode=1;
}finally{if(db)await db.close();}
