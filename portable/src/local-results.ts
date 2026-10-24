import type { Db } from './db.js';
import { audit, fail, hash, id, iso, lock, scope, type Principal } from './common.js';
import { characters, inputLimit } from './input-policy.js';
import { QuotaService } from './quota.js';

export interface LocalResultInput {
  tool: 'comments' | 'pdf' | 'run' | 'convert';
  source: string;
  output: string;
  language: string;
  targetLanguage?: string;
  historyMode: 'cloud';
  kind?: 'local' | 'example';
}

// These are explicitly user-supplied local-tool snapshots, never provider or
// isolated-execution evidence. Recording one must not dispatch or spend credits.
export class LocalResultService {
  constructor(private db: Db) {}
  async record(p: Principal, value: LocalResultInput, key: string, trace: string) {
    if (!/^[A-Za-z0-9_-]{8,100}$/.test(key)) fail('INVALID_IDEMPOTENCY_KEY');
    if (!['comments', 'pdf', 'run', 'convert'].includes(value.tool) || value.historyMode !== 'cloud' ||
        (value.kind!==undefined && !['local','example'].includes(value.kind)) ||
        typeof value.source !== 'string' || !value.source.trim() ||
        characters(value.source) > inputLimit(value.tool, true) ||
        typeof value.output !== 'string' || characters(value.output) > 200000 ||
        typeof value.language !== 'string' || !value.language.trim() || value.language.length > 60 ||
        (value.targetLanguage !== undefined && (typeof value.targetLanguage !== 'string' || !value.targetLanguage.trim() || value.targetLanguage.length > 60))) {
      fail('INVALID_LOCAL_RESULT');
    }
    const fingerprint = hash(JSON.stringify({ tool:value.tool,source:value.source,output:value.output,language:value.language,targetLanguage:value.targetLanguage ?? null,historyMode:'cloud',kind:value.kind??'local' }));
    const limiter = new QuotaService(this.db);
    const lease = await limiter.acquire(p, 'local-result', 20, 2, trace);
    try {
      return await this.db.transaction(async tx => {
        await scope(tx, p);
        await lock(tx, `run:${p.workspaceId}:${key}`);
        const prior = await tx.query('SELECT id,request_hash FROM tool_runs WHERE workspace_id=$1 AND owner_id=$2 AND idempotency_key=$3', [p.workspaceId, p.userId, key]);
        if (prior.rowCount) {
          if (prior.rows[0].request_hash !== fingerprint) fail('IDEMPOTENCY_CONFLICT', 409);
          return { id: prior.rows[0].id as string, status: 'completed' as const, replayed: true };
        }
        const runId = id();
        await tx.query("INSERT INTO tool_runs(id,workspace_id,owner_id,tool,source,instructions,language,target_language,model,idempotency_key,request_hash,trace_id,retention_until,history_mode,status,evaluation_allowed) VALUES($1,$2,$3,$4,$5,'',$6,$7,$8,$9,$10,$11,$12,'cloud','completed',false)", [runId,p.workspaceId,p.userId,value.tool,value.source,value.language,value.targetLanguage ?? null,value.kind==='example'?'local-example':'local-tool',key,fingerprint,trace,iso(Date.now()+30*86400000)]);
        await tx.query("INSERT INTO result_versions(id,run_id,workspace_id,owner_id,version,content,origin) VALUES($1,$2,$3,$4,1,$5,'local_tool')", [id(),runId,p.workspaceId,p.userId,value.output]);
        await tx.query("INSERT INTO run_events(run_id,event_type,data) VALUES($1,'done',$2)", [runId,JSON.stringify({ status:'completed',output:value.output,local:true })]);
        await audit(tx,p,'local_result.saved',runId,trace,{tool:value.tool,origin:'local_tool'});
        return { id:runId,status:'completed' as const,replayed:false };
      });
    } finally { await limiter.releaseLease(lease); }
  }
}
