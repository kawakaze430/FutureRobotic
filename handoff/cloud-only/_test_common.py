"""Bounded, sanitized subprocess evidence for the FutureRobotic test-only kit."""
from __future__ import annotations
import datetime,hashlib,json,os,shlex,signal,subprocess,time
from pathlib import Path

class Blocked(Exception):pass
class StepFailed(Exception):pass

class Evidence:
    def __init__(self,root:Path,scope:str):
        self.root=root.resolve();self.scope=scope;self.steps=[];self.secrets=[]
        stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        base=(self.root/os.environ.get('FR_EVIDENCE_ROOT','handoff/cloud-only/results')).resolve()
        if not base.is_relative_to(self.root):raise ValueError('Evidence output must remain within the project checkout.')
        self.out=base/scope/stamp
        self.out.mkdir(parents=True,exist_ok=True)
    def clean(self,text):
        text=str(text)
        for value in sorted(set(self.secrets),key=len,reverse=True):
            if value:text=text.replace(value,'[REDACTED]')
        return text
    def run(self,label,args,*,env=None,timeout=120,required=True):
        print(f'[{self.scope}] {label}',flush=True)
        started=time.monotonic()
        try:
            child=subprocess.Popen(args,cwd=self.root,env=env,text=True,encoding='utf-8',errors='replace',stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=os.name=='posix')
            try:
                body,_=child.communicate(timeout=timeout);code=child.returncode
            except subprocess.TimeoutExpired:
                if os.name=='posix':os.killpg(child.pid,signal.SIGTERM)
                else:child.terminate()
                try:body,_=child.communicate(timeout=3)
                except subprocess.TimeoutExpired:
                    if os.name=='posix':os.killpg(child.pid,signal.SIGKILL)
                    else:child.kill()
                    body,_=child.communicate()
                code=124;body+='\nStopped the owned command process group at its bounded timeout.\n'
        except FileNotFoundError:
            code,body=127,'Required executable is unavailable.\n'
        body=self.clean(body)
        log=self.out/(label+'.log');log.write_text(body)
        self.steps.append({'step':label,'command':self.clean(shlex.join(map(str,args))),'exit_code':code,'seconds':round(time.monotonic()-started,2),'log':str(log.relative_to(self.root))})
        if required and code!=0:raise StepFailed(f'{label} failed with exit {code}; inspect its sanitized log.')
        return code,body
    def finish(self,state,detail,**extra):
        try:
            head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=self.root,text=True,stderr=subprocess.DEVNULL).strip()
        except (OSError,subprocess.SubprocessError):head=None
        try:
            diff=subprocess.check_output(['git','diff','HEAD','--','.github','portable','runner','infra','lib','app','scripts','package.json','pnpm-lock.yaml','pnpm-workspace.yaml','handoff/cloud-only/*.py'],cwd=self.root)
        except (OSError,subprocess.SubprocessError):diff=None
        data={'scope':self.scope,'verification_status':state,'detail':self.clean(detail),'recorded_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'application_baseline':'76dda7b040a95e96c529073240056678d9f12ba4','actual_checkout_commit':head,'source_worktree_dirty':bool(diff) if diff is not None else None,'source_diff_sha256':hashlib.sha256(diff).hexdigest() if diff is not None else None,'steps':self.steps,'production_ready':False,'aws_deployed_by_this_runner':False,**extra}
        path=self.out/'result.json';path.write_text(json.dumps(data,indent=2)+'\n')
        print(json.dumps({'verification_status':state,'detail':self.clean(detail),'result':str(path.relative_to(self.root))},indent=2))
        return 0 if state.startswith('PASSED_') else 2 if state.startswith('BLOCKED_') else 1
