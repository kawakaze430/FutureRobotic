import { PGlite } from '@electric-sql/pglite';
import { Postgres, type Db, type Row, type QueryResult } from '../src/db.js';
import { randomUUID } from 'node:crypto';
import { IdentityService } from '../src/identity.js';
import { QuotaService } from '../src/quota.js';
import { LocalObjects } from '../src/content.js';
import { Telemetry } from '../src/telemetry.js';
export class WasmPostgres implements Db {
  private pg:PGlite;
  constructor(directory?:string){this.pg=new PGlite(directory);}
  async query<T extends Row=Row>(sql:string,values:unknown[]=[]):Promise<QueryResult<T>> {
    if(!values.length&&sql.includes(';')){
      const results=await this.pg.exec(sql);const r=results.at(-1);return {rows:(r?.rows??[]) as T[],rowCount:r?.affectedRows??0};
    }
    const r=await this.pg.query<T>(sql,values);return {rows:r.rows,rowCount:r.rows.length||r.affectedRows||0};
  }
  async transaction<T>(work:(db:Db)=>Promise<T>):Promise<T> {
    return this.pg.transaction(async tx=>{
      const adapter:Db={
        async query<R extends Row=Row>(sql:string,values:unknown[]=[]):Promise<QueryResult<R>>{
          if(!values.length&&sql.includes(';')){const list=await tx.exec(sql);const r=list.at(-1);return {rows:(r?.rows??[]) as R[],rowCount:r?.affectedRows??0};}
          const r=await tx.query<R>(sql,values);return {rows:r.rows,rowCount:r.rows.length||r.affectedRows||0};
        },
        async transaction<R>(fn:(db:Db)=>Promise<R>){return fn(adapter);},async close(){},
      };return work(adapter);
    });
  }
  async close(){await this.pg.close();}
}
export async function testDatabase(directory:string) {
  if(!process.env.TEST_DATABASE_URL)return {db:new WasmPostgres(directory) as Db,kind:'pglite',dispose:async()=>{}};
  const schema=`build01_${randomUUID().replaceAll('-','')}`;
  const admin=new Postgres({connectionString:process.env.TEST_DATABASE_URL});
  await admin.query(`CREATE SCHEMA ${schema}`);
  const db=new Postgres({connectionString:process.env.TEST_DATABASE_URL,options:`-c search_path=${schema}`,max:20});
  return {db:db as Db,kind:'native-postgresql',dispose:async()=>{await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.close();}};
}
export async function account(db:Db,label='user'){
  const identity=new IdentityService(db),n=randomUUID();
  const p=await identity.establish({issuer:'email',subject:n,email:`${label}-${n}@example.com`,emailVerified:true});
  const session=await identity.createSession(p.userId);p.sessionId=session.sessionId;
  await new QuotaService(db).grantStarter(p);
  return {p,session,identity};
}
export const silent=new Telemetry(()=>{});
export const input={tool:'convert' as const,source:'print("hello")',language:'Python',targetLanguage:'JavaScript'};
export function authHeaders(session:{sessionToken:string;csrfToken:string},key?:string){return {cookie:`fr_session=${session.sessionToken}`,origin:'http://localhost:3001','x-csrf-token':session.csrfToken,...(key?{'idempotency-key':key}:{})};}
export {LocalObjects};

// Paid entitlement fixture for tests that exercise cloud files (Free has no cloud slots).
export async function fileAccount(db:Db,label='files'){
 const a=await account(db,label),n=randomUUID();
 await db.query("INSERT INTO subscriptions(id,workspace_id,owner_id,provider,provider_id,plan_id,status,period_start,period_end,last_event_at) VALUES($1,$2,$3,'fixture',$4,'pro','active',now()-interval '1 minute',now()+interval '1 month',now())",[n,a.p.workspaceId,a.p.userId,n]);
 return a;
}
