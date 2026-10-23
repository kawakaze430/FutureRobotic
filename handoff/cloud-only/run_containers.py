#!/usr/bin/env python3
"""Build the existing portable Compose stack and inspect real readiness only."""
from __future__ import annotations
import argparse,hashlib,json,os,secrets,shutil,socket,tempfile,time,urllib.request
from pathlib import Path
from _test_common import Evidence,Blocked,StepFailed

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--project-root',default='.')
    parser.add_argument('--build-ca-file',default=os.environ.get('FR_BUILD_CA_FILE') or os.environ.get('NODE_EXTRA_CA_CERTS'),help='Optional trusted PEM CA bundle for build-time npm/pnpm; mounted by BuildKit, never copied into an image.')
    args=parser.parse_args();root=Path(args.project_root).resolve();ev=Evidence(root,'containers')
    env=os.environ.copy();password=secrets.token_urlsafe(32);env['LOCAL_DB_PASSWORD']=password;ev.secrets.append(password)
    project='fr-cloud-'+secrets.token_hex(6);compose=['docker','compose','-p',project,'-f','portable/compose.yml']
    started=False;override=None;state='FAILED_CONTAINER';detail='Container verification did not finish.';extra={'compose_project':project,'scope':'Existing image builds, development migrations and public health/status only. No real account/provider/payment/AWS acceptance.'}
    try:
        if not (root/'portable/compose.yml').is_file():raise Blocked('BLOCKED_SOURCE: select the complete FutureRobotic AI project root.')
        if not shutil.which('docker'):raise Blocked('BLOCKED_ENVIRONMENT B01: Docker client is absent.')
        code,_=ev.run('docker-engine',['docker','info','--format','{{.ServerVersion}}'],timeout=15,required=False)
        if code:raise Blocked('BLOCKED_ENVIRONMENT B01: Docker engine/socket is unavailable.')
        code,_=ev.run('compose-version',['docker','compose','version'],timeout=15,required=False)
        if code:raise Blocked('BLOCKED_DEPENDENCY: a usable Docker Compose plugin is unavailable.')
        runtime=root/'.sites-runtime';runtime.mkdir(exist_ok=True)
        env.setdefault('BUILDX_CONFIG',str(runtime/'buildx'))
        if args.build_ca_file:
            ca=Path(args.build_ca_file).resolve();body=ca.read_bytes()
            if len(body)>2_000_000 or b'-----BEGIN CERTIFICATE-----' not in body or b'PRIVATE KEY' in body:
                raise Blocked('BLOCKED_ENVIRONMENT: build CA must be a public PEM certificate bundle, never a private key.')
            extra['build_ca_sha256']=hashlib.sha256(body).hexdigest()
            override=tempfile.TemporaryDirectory(prefix='compose-trust-',dir=runtime)
            trust=Path(override.name)/'trust.json'
            trust.write_text(json.dumps({'services':{name:{'build':{'secrets':['build_ca']}} for name in ['api','migrate','web']},'secrets':{'build_ca':{'file':str(ca)}}}))
            compose+=['-f',str(trust)]
        try:
            with socket.socket() as s:s.bind(('127.0.0.1',8080))
        except OSError:raise Blocked('BLOCKED_ENVIRONMENT: loopback port 8080 is occupied; do not stop another service to free it.')
        started=True
        ev.run('compose-build',compose+['build'],env=env,timeout=900)
        _,images=ev.run('built-image-ids',compose+['images','--quiet'],env=env,timeout=20)
        extra['built_image_ids']=sorted(set(images.split()))
        ev.run('compose-start',compose+['up','--detach','--wait','--wait-timeout','120'],env=env,timeout=180)
        ev.run('compose-services',compose+['ps','--all'],env=env,timeout=20)
        _,images=ev.run('running-image-ids',compose+['images','--quiet'],env=env,timeout=20)
        extra['running_image_ids']=sorted(set(images.split()))
        if not extra['running_image_ids']:raise StepFailed('Running Compose image IDs were not recorded.')
        opener=urllib.request.build_opener(urllib.request.ProxyHandler({}));observed=[]
        for path in ('/health','/ready','/api/status'):
            deadline=time.monotonic()+30;last=None
            while time.monotonic()<deadline:
                try:
                    with opener.open('http://127.0.0.1:8080'+path,timeout=5) as response:
                        body=response.read(65537)
                        if response.status!=200 or len(body)>65536:raise ValueError('Unexpected status or excessive response body')
                        payload=json.loads(body);observed.append({'path':path,'status':200,'json_keys':sorted(payload) if isinstance(payload,dict) else []})
                        if path=='/health' and (not isinstance(payload,dict) or payload.get('status')!='ok'):raise ValueError('Health JSON did not report ok')
                        if path=='/ready' and (not isinstance(payload,dict) or payload.get('status')!='ready'):raise ValueError('Database readiness JSON did not report ready')
                        break
                except Exception as error:last=type(error).__name__;time.sleep(.5)
            else:raise StepFailed(f'{path} did not pass the bounded HTTP/JSON readiness check ({last}).')
        with opener.open('http://127.0.0.1:8080/',timeout=10) as response:
            body=response.read(2_000_000)
            if response.status!=200 or b'FutureRobotic' not in body:raise StepFailed('Built static homepage did not contain the expected brand.')
            observed.append({'path':'/','status':200,'brand_marker_found':True})
        extra['http_checks']=observed;state='PASSED_CONTAINER';detail='Existing Compose image build/migration/public readiness passed; authenticated and external integration gates remain pending.'
    except Blocked as e:state='BLOCKED_DEPENDENCY' if 'DEPENDENCY' in str(e) else 'BLOCKED_SOURCE' if 'SOURCE' in str(e) else 'BLOCKED_ENVIRONMENT';detail=str(e)
    except (StepFailed,OSError,ValueError) as e:state='FAILED_CONTAINER';detail=str(e)
    finally:
        if started:
            ev.run('compose-logs',compose+['logs','--no-color','--tail','120'],env=env,timeout=30,required=False)
            code,_=ev.run('owned-compose-cleanup',compose+['down','--volumes','--remove-orphans'],env=env,timeout=60,required=False)
            extra['owned_compose_cleanup_exit']=code
            if code and state=='PASSED_CONTAINER':state='FAILED_CLEANUP';detail='Smoke passed but owned Compose cleanup failed; inspect and finish cleanup.'
        if override:override.cleanup()
    return ev.finish(state,detail,**extra)

if __name__=='__main__':raise SystemExit(main())
