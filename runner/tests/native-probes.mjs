// Calls only the configured isolated gateway. Never executes source on this host.
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {signCapability} from '../src/policy.mjs';
const endpoint=process.env.RUNNER_TEST_ENDPOINT,keyFile=process.env.RUNNER_TEST_PRIVATE_KEY_FILE;
if(!endpoint||!keyFile){console.error('BLOCKED B01/B02: isolated gVisor gateway and protected test signing key are required.');process.exit(2);}
if(new URL(endpoint).protocol!=='https:')throw new Error('TLS runner gateway required');
const privateKey=await readFile(keyFile,'utf8');
const hello=r=>r.exitCode===0&&r.stdout?.includes('hello');
const failedExecution=r=>r.phase==='execute'&&r.exitCode!==0;
const probes=[
 {name:'python',language:'Python',source:'print("hello")',check:hello},
 {name:'javascript',language:'JavaScript',source:'console.log("hello")',check:hello},
 {name:'c',language:'C',source:'#include <stdio.h>\nint main(){puts("hello");}',check:hello},
 {name:'cpp',language:'C++',source:'#include <iostream>\nint main(){std::cout<<"hello";}',check:hello},
 {name:'java',language:'Java',source:'class Main {public static void main(String[] x){System.out.println("hello");}}',check:hello},
 {name:'cpu',language:'Python',source:'while True: pass',check:r=>failedExecution(r)||r.phase==='execute'&&r.timedOut===true},
 {name:'memory',language:'Python',source:'x=bytearray(1024*1024*1024)',check:failedExecution},
 {name:'fork',language:'Python',source:'import os\nfor i in range(100): os.fork()',check:failedExecution},
 {name:'disk',language:'Python',source:'open("/work/big","wb").write(b"x"*(100*1024*1024))',check:failedExecution},
 {name:'output',language:'Python',source:'print("x"*200000)',check:r=>r.phase==='execute'&&r.truncated===true},
 {name:'metadata-network',language:'Python',source:'import socket\ntry:\n socket.create_connection(("169.254.169.254",80),timeout=1)\n print("UNEXPECTED_NETWORK")\nexcept OSError:\n print("BLOCKED")',check:r=>r.exitCode===0&&r.stdout?.trim()==='BLOCKED'},
 {name:'internet-network',language:'Python',source:'import socket\ntry:\n socket.create_connection(("1.1.1.1",53),timeout=1)\n print("UNEXPECTED_NETWORK")\nexcept OSError:\n print("BLOCKED")',check:r=>r.exitCode===0&&r.stdout?.trim()==='BLOCKED'},
 {name:'no-app-secrets',language:'Python',source:'import os\nprint(any(k in os.environ for k in ["DB_PASSWORD","AI_HTTP_API_KEY","AWS_ACCESS_KEY_ID"]))',check:r=>r.exitCode===0&&r.stdout?.trim()==='False'},
 {name:'residue-write',language:'Python',source:'open("/work/residue","w").write("sentinel")',check:r=>r.exitCode===0},
 {name:'residue-clean',language:'Python',source:'import os\nprint(os.path.exists("/work/residue"))',check:r=>r.exitCode===0&&r.stdout?.trim()==='False'}
];
let failed=false;
for(const probe of probes){const job={id:randomUUID(),language:probe.language,source:probe.source,stdin:''},start=Date.now();try{const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','x-job-capability':signCapability(job,privateKey)},body:JSON.stringify(job),signal:AbortSignal.timeout(18000)});const bytes=await r.arrayBuffer();if(bytes.byteLength>150000)throw new Error('OUTPUT_UNBOUNDED');const result=JSON.parse(new TextDecoder().decode(bytes)),bounded=typeof result.stdout==='string'&&typeof result.stderr==='string'&&Buffer.byteLength(result.stdout)+Buffer.byteLength(result.stderr)<=131072;const pass=r.ok&&bounded&&Date.now()-start<18000&&probe.check(result);failed||=!pass;console.log(JSON.stringify({probe:probe.name,pass,elapsedMs:Date.now()-start,status:r.status}));}catch{failed=true;console.log(JSON.stringify({probe:probe.name,pass:false,error:'ISOLATION_PROBE_FAILED'}));}}
process.exitCode=failed?1:0;
