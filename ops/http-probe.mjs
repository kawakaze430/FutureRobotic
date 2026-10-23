import {performance} from 'node:perf_hooks';
const origin=process.env.PROBE_ORIGIN;if(!origin)throw new Error('Set PROBE_ORIGIN');const url=new URL(origin);if(url.origin!==origin||url.username||url.password)throw new Error('Exact public origin required');
const paths=['/','/code-privacy','/python-to-javascript-converter','/api/status','/ready'];let failed=false;
for(const path of paths){const start=performance.now();try{const r=await fetch(origin+path,{redirect:'error',signal:AbortSignal.timeout(15000)});await r.arrayBuffer();const pass=r.ok;failed||=!pass;console.log(JSON.stringify({path,status:r.status,durationMs:Math.round(performance.now()-start),pass,region:process.env.PROBE_REGION??'unspecified'}));}catch{failed=true;console.log(JSON.stringify({path,pass:false,error:'PROBE_FAILED'}));}}
process.exitCode=failed?1:0;
