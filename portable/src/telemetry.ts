import { safeTrace } from './common.js';
export interface LogEvent {event:string; traceId?:string; requestId?:string; runId?:string; jobId?:string; status?:string|number; errorCode?:string; durationMs?:number}
const keys=['event','traceId','requestId','runId','jobId','status','errorCode','durationMs'] as const;
export class Telemetry {
  constructor(private sink:(line:string)=>void=line=>process.stdout.write(line+'\n')) {}
  emit(event:LogEvent) {
    // Whitelist metadata; no arbitrary object serialization, request bodies or Error.message.
    const record:Record<string,string|number>={at:new Date().toISOString()};
    for(const key of keys) {
      const value=event[key];
      if(typeof value==='number'&&Number.isFinite(value)) record[key]=value;
      else if(typeof value==='string'&&/^[a-zA-Z0-9_.:-]{1,100}$/.test(value)) record[key]=value;
    }
    this.sink(JSON.stringify(record));
  }
}
export function traceFromParent(parent:unknown) {
  const m=typeof parent==='string'?/^00-([a-f0-9]{32})-([a-f0-9]{16})-(?:00|01)$/.exec(parent):null;
  return safeTrace(m?.[1]);
}
