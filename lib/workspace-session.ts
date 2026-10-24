/** Invalidates stale reads without relying on transport abort being honored. */
export class SelectionEpoch {
  private value = 0;
  next() { return ++this.value; }
  current(value: number) { return value === this.value; }
  capture() { return this.value; }
}

interface NoteState {
  saved: string;
  draft: string;
  version: number | null;
  blocked: Error | null;
  tail: Promise<void>;
}

/** Serialize optimistic writes per result; a reply never supplies another result's version. */
export class ResultNoteQueue {
  private entries = new Map<string, NoteState>();
  private generation = 0;
  constructor(private write: (id: string, content: string, version: number | null) => Promise<{version: number}>) {}
  remember(id: string, content: string, version: number | null) {
    this.entries.set(id, {saved: content, draft: content, version, blocked: null, tail: Promise.resolve()});
  }
  state(id: string) { return this.entries.get(id); }
  edit(id: string, content: string) { const entry = this.entries.get(id); if (entry) entry.draft = content; }
  idle(id: string) { return this.entries.get(id)?.tail ?? Promise.resolve(); }
  clear() { this.generation++; this.entries.clear(); }
  save(id: string, content: string) {
    const entry = this.entries.get(id);
    if (!entry) return Promise.reject(new Error('Reload this result before saving its note.'));
    entry.draft = content;
    const generation = this.generation;
    const pending = entry.tail.then(async () => {
      if (generation !== this.generation) throw new DOMException('The account changed.', 'AbortError');
      if (entry.blocked) throw entry.blocked;
      if (entry.saved === content) return {version: entry.version};
      try {
        const result = await this.write(id, content, entry.version);
        entry.version = result.version;
        entry.saved = content;
        return result;
      } catch (error) {
        entry.blocked = error instanceof Error ? error : new Error('Note could not be saved.');
        throw entry.blocked;
      }
    });
    // Keep the queue alive but never retry an external edit conflict implicitly.
    entry.tail = pending.then(() => {}, () => {});
    return pending;
  }
}

export function workspaceTool(tool: string): import('./studio-data').ToolId {
  if (tool === 'review') return 'check';
  return ['convert','generate','explain','comments','check','fix','pdf','run'].includes(tool)
    ? tool as import('./studio-data').ToolId : 'explain';
}

export interface PendingJob {id: string; key: string; operation: 'export' | 'delete'}
export function jobStorageKey(owner: string, scope: 'account' | 'history') {
  return `futurerobotic-${scope}-job-${owner}`;
}
export function readPendingJob(storage: Pick<Storage, 'getItem'>, owner: string, scope: 'account' | 'history'): PendingJob | null {
  try {
    const value: unknown = JSON.parse(storage.getItem(jobStorageKey(owner, scope)) ?? 'null');
    if (!value || typeof value !== 'object') return null;
    const job = value as Record<string, unknown>;
    if (typeof job.id !== 'string' || (job.id !== '' && !/^[0-9a-f-]{36}$/i.test(job.id)) ||
        typeof job.key !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(job.key) ||
        (job.operation !== 'export' && job.operation !== 'delete')) return null;
    return {id: job.id, key: job.key, operation: job.operation};
  } catch { return null; }
}
export function storePendingJob(storage: Pick<Storage, 'setItem' | 'removeItem'>, owner: string, scope: 'account' | 'history', job: PendingJob | null) {
  try {
    const key = jobStorageKey(owner, scope);
    if (job) storage.setItem(key, JSON.stringify(job)); else storage.removeItem(key);
  } catch { /* Server-side owned discovery still supports recovery with storage disabled. */ }
}
