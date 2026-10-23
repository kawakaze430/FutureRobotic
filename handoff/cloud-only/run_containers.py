#!/usr/bin/env python3
"""Build the existing portable Compose stack and inspect real readiness only."""
from __future__ import annotations
import argparse,json,os,secrets,shutil,socket,time,urllib.request
from pathlib import Path
from _test_common import Evidence,Blocked,StepFailed

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--project-root',default='.')
    args=parser.parse_args();root=Path(args.project_root).resolve();ev=Evidence(root,'containers')
    env=os.environ.copy();password=secrets.token_urlsafe(32);env['LOCAL_DB_PASSWORD']=password;ev.secrets.append(password)
    project='fr-cloud-'+secrets.token_hex(6);compose=['docker','compose','-p',project,'-f','portable/compose.yml']
    started=False;state='FAILED_CONTAINER';detail='Container verification did not finish.';extra={'compose_project':project,'scope':'Existing image builds, development migrations and public health/status only. No real account/provider/payment/AWS acceptance.'}
    try:
        if not (root/'portable/compose.yml').is_file():raise Blocked('BLOCKED_SOURCE: select the complete FutureRobotic AI project root.')
        if not shutil.which('docker'):raise Blocked('BLOCKED_ENVIRONMENT B01: Docker client is absent.')
        code,_=ev.run('docker-engine',['docker','info','--format','{{.ServerVersion}}'],timeout=15,required=False)
        if code:raise Blocked('BLOCKED_ENVIRONMENT B01: Docker engine/socket is unavailable.')
        code,_=ev.run('compose-version',['docker','compose','version'],timeout=15,required=False)
        if code:raise Blocked('BLOCKED_DEPENDENCY: a usable Docker Compose plugin is unavailable.')
        try:
            with socket.socket() as s:s.bind(('127.0.0.1',8080))
        except OSError:raise Blocked('BLOCKED_ENVIRONMENT: loopback port 8080 is occupied; do not stop another service to free it.')
        started=True
        ev.run('compose-build-start',compose+['up','--build','--detach','--wait','--wait-timeout','120'],env=env,timeout=900)
        ev.run('compose-services',compose+['ps','--all'],env=env,timeout=20)
        ev.run('built-image-ids',compose+['images','--quiet'],env=env,timeout=20)
        opener=urllib.request.build_opener(urllib.request.ProxyHandler({}));observed=[]
        for path in ('/health','/api/status'):
            deadline=time.monotonic()+30;last=None
            while time.monotonic()<deadline:
                try:
                    with opener.open('http://127.0.0.1:8080'+path,timeout=5) as response:
                        body=response.read(65537)
                        if response.status!=200 or len(body)>65536:raise ValueError('Unexpected status or excessive response body')
                        payload=json.loads(body);observed.append({'path':path,'status':200,'json_keys':sorted(payload) if isinstance(payload,dict) else []})
                        if path=='/health' and (not isinstance(payload,dict) or payload.get('status')!='ok'):raise ValueError('Health JSON did not report ok')
                        break
                except Exception as error:last=type(error).__name__;time.sleep(.5)
            else:raise StepFailed(f'{path} did not pass the bounded HTTP/JSON readiness check ({last}).')
        extra['http_checks']=observed;state='PASSED_CONTAINER';detail='Existing Compose image build/migration/public readiness passed; authenticated and external integration gates remain pending.'
    except Blocked as e:state='BLOCKED_DEPENDENCY' if 'DEPENDENCY' in str(e) else 'BLOCKED_SOURCE' if 'SOURCE' in str(e) else 'BLOCKED_ENVIRONMENT';detail=str(e)
    except (StepFailed,OSError,ValueError) as e:state='FAILED_CONTAINER';detail=str(e)
    finally:
        if started:
            ev.run('compose-logs',compose+['logs','--no-color','--tail','120'],env=env,timeout=30,required=False)
            code,_=ev.run('owned-compose-cleanup',compose+['down','--volumes','--remove-orphans'],env=env,timeout=60,required=False)
            extra['owned_compose_cleanup_exit']=code
            if code and state=='PASSED_CONTAINER':state='FAILED_CLEANUP';detail='Smoke passed but owned Compose cleanup failed; inspect and finish cleanup.'
    return ev.finish(state,detail,**extra)

if __name__=='__main__':raise SystemExit(main())
