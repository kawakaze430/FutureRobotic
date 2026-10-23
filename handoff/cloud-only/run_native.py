#!/usr/bin/env python3
"""Run every existing backend suite against disposable native PostgreSQL.

Does not fall back to PGlite. Missing native facilities return exit 2.
An externally supplied TEST_DATABASE_URL requires FR_DISPOSABLE_NATIVE_DB=true.
"""
from __future__ import annotations
import argparse,json,os,re,secrets,shutil,subprocess,time
from pathlib import Path
from _test_common import Evidence,Blocked,StepFailed

NATIVE_PROOF=r'''
import pg from 'pg';
import {randomInt} from 'node:crypto';
const pool=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL,max:2,connectionTimeoutMillis:5000,query_timeout:5000});
let a,b;
try {
  a=await pool.connect();b=await pool.connect();
  const first=(await a.query('SELECT version() AS version,pg_backend_pid() AS pid')).rows[0];
  const second=(await b.query('SELECT pg_backend_pid() AS pid')).rows[0];
  if(first.pid===second.pid)throw Error('Distinct native backends required');
  const key=randomInt(1,2147483647);
  await a.query('BEGIN');await b.query('BEGIN');
  const owns=(await a.query('SELECT pg_try_advisory_xact_lock($1) AS ok',[key])).rows[0].ok;
  const denied=(await b.query('SELECT pg_try_advisory_xact_lock($1) AS ok',[key])).rows[0].ok;
  if(!owns||denied)throw Error('Native transaction lock exclusion failed');
  await a.query('ROLLBACK');
  const released=(await b.query('SELECT pg_try_advisory_xact_lock($1) AS ok',[key])).rows[0].ok;
  if(!released)throw Error('Native transaction lock release failed');
  await b.query('ROLLBACK');
  console.log(JSON.stringify({database:'native-postgresql',version:first.version,distinctBackendPids:[first.pid,second.pid],transactionLockExclusion:true}));
} catch(error) {
  console.error('Native connection/transaction proof failed:',error?.code||'NATIVE_PROOF_FAILED');
  process.exitCode=1;
} finally {
  for(const c of [a,b])if(c){await c.query('ROLLBACK').catch(()=>{});c.release();}
  await pool.end();
}
'''

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--project-root',default='.')
    args=parser.parse_args();root=Path(args.project_root).resolve();ev=Evidence(root,'native-postgres')
    container=None;env=os.environ.copy();env['NODE_ENV']='test';state='FAILED_NATIVE';detail='Native verification did not finish.';extra={}
    supplied=env.get('TEST_DATABASE_URL','')
    if supplied:ev.secrets.append(supplied)
    try:
        if not (root/'portable/tests/support.ts').is_file():raise Blocked('BLOCKED_SOURCE: project root must contain the complete portable backend source.')
        if supplied:
            if env.get('FR_DISPOSABLE_NATIVE_DB')!='true':raise Blocked('BLOCKED_ACCOUNT: a supplied native URL must explicitly identify a disposable test database via FR_DISPOSABLE_NATIVE_DB=true.')
            database_url=supplied
        else:
            if not shutil.which('docker'):raise Blocked('BLOCKED_ENVIRONMENT B01: Docker client is absent and no explicitly disposable native database was supplied.')
            code,_=ev.run('docker-engine',['docker','info','--format','{{.ServerVersion}}'],timeout=15,required=False)
            if code:raise Blocked('BLOCKED_ENVIRONMENT B01: Docker engine/socket is unavailable; no PGlite fallback was used.')
            container='fr-native-'+secrets.token_hex(6);password=secrets.token_urlsafe(32);ev.secrets.append(password)
            db_env=env.copy();db_env['POSTGRES_PASSWORD']=password
            ev.run('postgres-start',['docker','run','--rm','-d','--name',container,'-e','POSTGRES_PASSWORD','-p','127.0.0.1::5432','postgres:16'],env=db_env,timeout=180)
            end=time.monotonic()+45;ready=False
            while time.monotonic()<end:
                probe=subprocess.run(['docker','exec',container,'pg_isready','-U','postgres'],capture_output=True,timeout=5)
                if probe.returncode==0:ready=True;break
                time.sleep(.5)
            if not ready:raise StepFailed('Disposable PostgreSQL readiness timed out.')
            _,mapping=ev.run('postgres-port',['docker','port',container,'5432/tcp'],timeout=10)
            match=re.fullmatch(r'127\.0\.0\.1:(\d+)',mapping.strip())
            if not match:raise StepFailed('PostgreSQL test port must be loopback-only.')
            database_url=f'postgresql://postgres:{password}@127.0.0.1:{match[1]}/postgres'
            ev.secrets.append(database_url)
            ev.run('postgres-image',['docker','inspect','--format','{{.Image}}',container],timeout=10)
        env['TEST_DATABASE_URL']=database_url
        if not shutil.which('node') or not (root/'node_modules/typescript/bin/tsc').is_file():raise Blocked('BLOCKED_DEPENDENCY: install the locked Node/pnpm dependencies once before native verification.')
        ev.run('api-build',['node','node_modules/typescript/bin/tsc','-p','portable/tsconfig.json'],env=env,timeout=120)
        _,proof=ev.run('native-connections',['node','--input-type=module','-e',NATIVE_PROOF],env=env,timeout=30)
        extra['native_connection_proof']=json.loads(proof.strip())
        sources=sorted((root/'portable/tests').glob('*.test.ts'))
        suites=[root/'portable/dist/tests'/(p.stem+'.js') for p in sources]
        if not suites or any(not p.is_file() for p in suites):raise StepFailed('A compiled existing backend suite is missing.')
        extra['suites']=[str(p.relative_to(root)) for p in suites]
        code,tap=ev.run('native-backend-tap',['node','--test','--test-reporter=tap',*[str(p.relative_to(root)) for p in suites]],env=env,timeout=360,required=False)
        counts={k:int(v) for k,v in re.findall(r'^# (tests|pass|fail|skipped|cancelled) (\d+)\s*$',tap,re.M)}
        extra['tap_counts']=counts;extra['scope']='All existing backend suites, native connections and advisory exclusion; no live provider/payment/AWS/runner acceptance.'
        if code or not counts.get('tests') or not counts.get('pass') or counts.get('fail',1) or counts.get('cancelled',1):raise StepFailed('Native backend suite failed or did not produce a complete TAP summary with actual passes.')
        state='PASSED_NATIVE_WITH_SKIPS' if counts.get('skipped') else 'PASSED_NATIVE';detail='Native backend suites completed. Inspect counts/skips and exact scenario scope before closing any feature gate; skipped scenarios remain unverified.'
    except Blocked as e:state='BLOCKED_ENVIRONMENT' if 'ENVIRONMENT' in str(e) else 'BLOCKED_ACCOUNT' if 'ACCOUNT' in str(e) else 'BLOCKED_DEPENDENCY' if 'DEPENDENCY' in str(e) else 'BLOCKED_SOURCE';detail=str(e)
    except (StepFailed,subprocess.SubprocessError,ValueError,OSError) as e:state='FAILED_NATIVE';detail=str(e)
    finally:
        if container:
            code,_=ev.run('postgres-cleanup',['docker','rm','-f',container],timeout=30,required=False)
            extra['owned_container_cleanup_exit']=code
            if code and state.startswith('PASSED_NATIVE'):state='FAILED_CLEANUP';detail='Native suite passed but owned disposable container cleanup failed; inspect and finish cleanup.'
    return ev.finish(state,detail,**extra)

if __name__=='__main__':raise SystemExit(main())
