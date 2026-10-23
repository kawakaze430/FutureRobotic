"""Runs only inside the isolated, disposable gVisor container. Never invoke on the application host."""
import json, os, resource, selectors, signal, subprocess, sys, tempfile, time

MAX_OUTPUT=65536
LANGUAGES={'Python':('main.py',['python3','-I','main.py']), 'JavaScript':('main.js',['node','--max-old-space-size=128','main.js']), 'C':('main.c',['./main']), 'C++':('main.cpp',['./main']), 'Java':('Main.java',['java','-Xmx128m','-XX:ActiveProcessorCount=1','Main'])}
def restrict():
 os.setsid()
 resource.setrlimit(resource.RLIMIT_CPU,(3,3))
 resource.setrlimit(resource.RLIMIT_FSIZE,(8*1024*1024,8*1024*1024))
 resource.setrlimit(resource.RLIMIT_NOFILE,(64,64))
 resource.setrlimit(resource.RLIMIT_NPROC,(32,32))

def run(argv,stdin,cwd):
 process=subprocess.Popen(argv,cwd=cwd,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env={'PATH':'/usr/local/bin:/usr/bin:/bin','HOME':cwd,'TMPDIR':'/tmp','LANG':'C.UTF-8'},preexec_fn=restrict)
 process.stdin.write(stdin.encode());process.stdin.close()
 selected=selectors.DefaultSelector();selected.register(process.stdout,selectors.EVENT_READ,'stdout');selected.register(process.stderr,selectors.EVENT_READ,'stderr')
 data={'stdout':bytearray(),'stderr':bytearray()};start=time.monotonic();truncated=False;timed_out=False
 while selected.get_map():
  if time.monotonic()-start>3:timed_out=True;os.killpg(process.pid,signal.SIGKILL);break
  for key,_ in selected.select(.05):
   chunk=os.read(key.fileobj.fileno(),4096)
   if not chunk:selected.unregister(key.fileobj);continue
   remaining=MAX_OUTPUT-len(data['stdout'])-len(data['stderr']);data[key.data].extend(chunk[:max(remaining,0)])
   if len(chunk)>remaining:truncated=True;os.killpg(process.pid,signal.SIGKILL);break
  if truncated:break
 process.wait(timeout=1)
 return {'stdout':data['stdout'].decode('utf-8','replace'),'stderr':data['stderr'].decode('utf-8','replace'),'exitCode':process.returncode,'durationMs':round((time.monotonic()-start)*1000),'truncated':truncated,'timedOut':timed_out}

def main():
 raw=sys.stdin.buffer.read(60001)
 if len(raw)>60000:raise ValueError('BODY_LIMIT')
 job=json.loads(raw);language=job['language'];source=job['source'];stdin=job.get('stdin','')
 if language not in LANGUAGES or len(source)>10000 or len(stdin.encode())>10000:raise ValueError('INPUT_LIMIT')
 with tempfile.TemporaryDirectory(prefix='job-',dir='/work') as directory:
  filename,command=LANGUAGES[language]
  with open(os.path.join(directory,filename),'w',encoding='utf-8') as f:f.write(source)
  compile_commands={'C':['gcc','-O0','-o','main','main.c'],'C++':['g++','-std=c++20','-O0','-o','main','main.cpp'],'Java':['javac','-J-Xmx128m','Main.java']}
  if language in compile_commands:
   result=run(compile_commands[language],'',directory)
   if result['exitCode']!=0:result['phase']='compile';print(json.dumps(result));return
  result=run(command,stdin,directory);result['phase']='execute';print(json.dumps(result))
if __name__=='__main__':
 try:main()
 except Exception:print(json.dumps({'stdout':'','stderr':'Sandbox job failed.','exitCode':1,'durationMs':0,'truncated':False,'timedOut':False,'phase':'validation'}))
