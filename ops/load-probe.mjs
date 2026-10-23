// Readiness-only saturation probe. Does not send AI, payment or untrusted jobs.
import {performance} from 'node:perf_hooks';
const origin=process.env.LOAD_ORIGIN;if(!origin)throw new Error('Set LOAD_ORIGIN to an authorized staging origin');const requests=Number(process.env.LOAD_REQUESTS??100),concurrency=Number(process.env.LOAD_CONCURRENCY??10);
if(!Number.isInteger(requests)||requests<1||requests>10000||!Number.isInteger(concurrency)||concurrency<1||concurrency>50)throw new Error('Probe exceeds configured test bounds');
const times=[];let next=0,errors=0;
await Promise.all(Array.from({length:concurrency},async()=>{while(next++<requests){const start=performance.now();try{const r=await fetch(origin+'/ready',{signal:AbortSignal.timeout(10000)});await r.arrayBuffer();if(!r.ok)errors++;}catch{errors++;}times.push(performance.now()-start);}}));times.sort((a,b)=>a-b);const result={requests,concurrency,errors,p50Ms:Math.round(times[Math.floor(times.length*.5)]),p95Ms:Math.round(times[Math.min(times.length-1,Math.floor(times.length*.95))]),proposedP95LimitMs:1000};console.log(JSON.stringify(result));process.exitCode=errors||result.p95Ms>1000?1:0;
