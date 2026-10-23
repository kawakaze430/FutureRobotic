import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {S3Client} from '@aws-sdk/client-s3';
import {SESv2Client} from '@aws-sdk/client-sesv2';
import {SQSClient} from '@aws-sdk/client-sqs';
import {buildApi} from './api.js';
import {databaseFromEnvironment} from './config.js';
import {LocalObjects,type ObjectStore} from './content.js';
import {LifecycleService} from './lifecycle.js';
import {Telemetry} from './telemetry.js';
import {Worker} from './worker.js';
import {Sealer} from './crypto.js';
import {PublicAuth,TurnstileVerifier} from './public-auth.js';
import {S3Objects,SesMailer} from './cloud-files.js';
import {HttpCodeProvider} from './provider.js';
import {PaddleGateway} from './merchant.js';
import {SqsWakeup} from './wakeup.js';
import {ExecutionService} from './execution.js';

const production=process.env.NODE_ENV==='production',role=process.env.PROCESS_ROLE??'all';
if(!['api','worker','all'].includes(role))throw new Error('PROCESS_ROLE must be api, worker or all');
const origin=process.env.APP_ORIGIN??'http://localhost:3001';
if(production&&(process.env.RELEASE_CONFIGURATION_APPROVED!=='true'||!origin.startsWith('https://')||!process.env.S3_BUCKET||!process.env.S3_KMS_KEY_ARN||!process.env.APP_ENCRYPTION_KEY||!process.env.AUTH_HASH_SECRET))throw new Error('Production release configuration, HTTPS, encrypted private storage and authentication secrets must be approved/configured');
const db=databaseFromEnvironment(),telemetry=new Telemetry(),region=process.env.AWS_REGION??'ap-south-1';
const objects:ObjectStore=process.env.S3_BUCKET?new S3Objects(new S3Client({region}),process.env.S3_BUCKET,process.env.S3_KMS_KEY_ARN??''):new LocalObjects(resolve(process.env.OBJECT_DIRECTORY??'portable/.data/objects'));
const sealer=process.env.APP_ENCRYPTION_KEY?new Sealer(process.env.APP_ENCRYPTION_KEY):undefined;
const auth=sealer&&process.env.AUTH_HASH_SECRET?new PublicAuth(db,{origin,sealer,hashSecret:process.env.AUTH_HASH_SECRET,
 google:process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET?{id:process.env.GOOGLE_CLIENT_ID,secret:process.env.GOOGLE_CLIENT_SECRET}:undefined,
 github:process.env.GITHUB_CLIENT_ID&&process.env.GITHUB_CLIENT_SECRET?{id:process.env.GITHUB_CLIENT_ID,secret:process.env.GITHUB_CLIENT_SECRET}:undefined,
 mailer:process.env.SES_FROM_EMAIL?new SesMailer(new SESv2Client({region}),process.env.SES_FROM_EMAIL):undefined,
 human:process.env.TURNSTILE_SECRET?new TurnstileVerifier(process.env.TURNSTILE_SECRET,new URL(origin).hostname):undefined,
}):undefined;
if(production&&role!=='worker'&&!Object.values(auth?.providers()??{}).some(Boolean))throw new Error('Configure at least one public identity provider before production startup');
const provider=role!=='api'&&process.env.AI_HTTP_ENDPOINT&&process.env.AI_HTTP_API_KEY?new HttpCodeProvider({endpoint:process.env.AI_HTTP_ENDPOINT,key:process.env.AI_HTTP_API_KEY,models:JSON.parse(process.env.AI_MODELS_JSON??'{}'),inputMicroUsdPerMillion:Number(process.env.AI_INPUT_MICRO_USD_PER_MILLION??-1),outputMicroUsdPerMillion:Number(process.env.AI_OUTPUT_MICRO_USD_PER_MILLION??-1),retentionApproved:process.env.AI_RETENTION_APPROVED==='true'}):null;
const merchant=process.env.PADDLE_API_KEY&&process.env.PADDLE_WEBHOOK_SECRET?new PaddleGateway(db,{mode:process.env.PADDLE_MODE==='live'?'live':'sandbox',apiKey:process.env.PADDLE_API_KEY,webhookSecrets:[process.env.PADDLE_WEBHOOK_SECRET],approved:process.env.BILLING_RELEASE_APPROVED==='true',countries:(process.env.APPROVED_COUNTRIES??'').split(',').filter(Boolean),priceIds:JSON.parse(process.env.PADDLE_PRICE_IDS_JSON??'{}'),origin}):undefined;
const bus=process.env.WAKEUP_QUEUE_URL?new SqsWakeup(new SQSClient({region}),process.env.WAKEUP_QUEUE_URL):undefined;
const app=role!=='worker'?await buildApi({db,objects,origin,production,proxyHops:Number(process.env.TRUSTED_EDGE_HOPS??0),telemetry,auth,sealer,merchant,providerReady:process.env.AI_ENABLED==='true',turnstileSiteKey:process.env.TURNSTILE_SITE_KEY,anonymousHashSecret:process.env.AUTH_HASH_SECRET}):undefined;
const worker=new Worker(db,objects,provider,telemetry),lifecycle=new LifecycleService(db);let stopped=false;
const notifyTimer=role!=='worker'&&bus?setInterval(()=>{void bus.publish(db).catch(()=>telemetry.emit({event:'queue.notification_failed',errorCode:'SQS_UNAVAILABLE'}));},1000):undefined;
const background=async()=>{
 while(!stopped){
  try{await lifecycle.schedule();await writeFile('/tmp/fr-worker-heartbeat',String(Date.now()));if(await worker.tick())continue;if(process.env.RUNNER_ENDPOINT&&process.env.RUNNER_SIGNING_KEY&&process.env.AUTH_HASH_SECRET&&await new ExecutionService(db,process.env.AUTH_HASH_SECRET).dispatch(process.env.RUNNER_ENDPOINT,process.env.RUNNER_SIGNING_KEY))continue;if(bus){await bus.wait();continue;}}
  catch{telemetry.emit({event:'worker.failed',errorCode:'WORKER_TICK_FAILED'});}
  await new Promise(r=>setTimeout(r,1000));
 }
};
const running=role!=='api'?background():Promise.resolve();
if(app)await app.listen({port:Number(process.env.PORT??3001),host:process.env.HOST??'127.0.0.1'});
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{stopped=true;if(notifyTimer)clearInterval(notifyTimer);void (async()=>{await app?.close();await running;await db.close();})();});
