import {createServer} from 'node:http';
import {spawn,spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {containerArgs,limits,verifyCapability} from './policy.mjs';
export function executeDocker(job,image){return new Promise((resolve,reject)=>{
 const args=containerArgs(job,image),name=`frjob-${job.id}`,child=spawn('docker',args,{stdio:['pipe','pipe','pipe'],env:{PATH:process.env.PATH}});
 let output=Buffer.alloc(0),error=Buffer.alloc(0),ended=false;
 const cleanup=()=>{spawnSync('docker',['kill',name],{stdio:'ignore',timeout:3000});spawnSync('docker',['rm','-f',name],{stdio:'ignore',timeout:3000});};
 const timer=setTimeout(()=>{ended=true;child.kill('SIGKILL');cleanup();reject(new Error('SANDBOX_WALL_LIMIT'));},limits.wallMs);
 child.stdout.on('data',chunk=>{output=Buffer.concat([output,chunk]);if(output.length>100000){child.kill('SIGKILL');cleanup();}});
 child.stderr.on('data',chunk=>{if(error.length<4000)error=Buffer.concat([error,chunk]).subarray(0,4000);});
 child.once('error',()=>{clearTimeout(timer);cleanup();reject(new Error('SANDBOX_UNAVAILABLE'));});
 child.once('exit',code=>{clearTimeout(timer);if(ended)return;cleanup();if(code!==0)return reject(new Error('SANDBOX_FAILED'));try{const result=JSON.parse(output.toString());if(typeof result.stdout!=='string'||typeof result.stderr!=='string'||result.stdout.length+result.stderr.length>limits.outputBytes*2)throw new Error();resolve(result);}catch{reject(new Error('INVALID_SANDBOX_RESULT'));}});
 child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify(job));
 });}
if(process.env.RUNNER_PUBLIC_KEY_FILE&&process.env.RUNNER_IMAGE){
 const publicKey=readFileSync(process.env.RUNNER_PUBLIC_KEY_FILE,'utf8'),seen=new Map();let active=0;
 const server=createServer(async(req,res)=>{
  res.setHeader('content-type','application/json');res.setHeader('cache-control','no-store');
  if(req.url==='/health'&&req.method==='GET'){res.end('{"status":"ok"}');return;}
  if(req.url!=='/execute'||req.method!=='POST'){res.statusCode=404;res.end('{"error":"NOT_FOUND"}');return;}
  if(active>=2){res.statusCode=429;res.end('{"error":"RUNNER_BUSY"}');return;}
  let bytes=0;const chunks=[];
  try{for await(const chunk of req){bytes+=chunk.length;if(bytes>60000)throw new Error('BODY_LIMIT');chunks.push(chunk);}const job=JSON.parse(Buffer.concat(chunks).toString());verifyCapability(req.headers['x-job-capability'],job,publicKey,seen);active++;try{res.end(JSON.stringify(await executeDocker(job,process.env.RUNNER_IMAGE)));}finally{active--;}}
  catch{res.statusCode=400;res.end('{"error":"EXECUTION_REJECTED_OR_UNAVAILABLE"}');}
 });server.requestTimeout=15000;server.headersTimeout=5000;server.listen(Number(process.env.PORT??8081),process.env.RUNNER_BIND_HOST??'127.0.0.1');
}
