import { spawnSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
const command=(args,options={})=>spawnSync(args[0],args.slice(1),{encoding:'utf8',...options});
if(command(['docker','info']).status!==0){process.stderr.write('BLOCKED B01: Docker engine is unavailable. Use TEST_DATABASE_URL with a disposable PostgreSQL database or run this script on a Docker host.\n');process.exit(2);}
const name=`futurerobotic-test-${randomUUID().slice(0,8)}`,password=randomBytes(32).toString('base64url');
const env={...process.env,POSTGRES_PASSWORD:password};
try{
  const start=command(['docker','run','--rm','-d','--name',name,'-e','POSTGRES_PASSWORD','-p','127.0.0.1::5432','postgres:16'],{env});
  if(start.status!==0)throw new Error('PostgreSQL test container failed to start');
  const end=Date.now()+60000;let ready=false;
  while(Date.now()<end){if(command(['docker','exec',name,'pg_isready','-U','postgres']).status===0){ready=true;break;}await new Promise(r=>setTimeout(r,500));}
  if(!ready)throw new Error('PostgreSQL test container readiness timed out');
  const mapping=command(['docker','port',name,'5432/tcp']).stdout.trim();const port=Number(mapping.split(':').at(-1));
  if(!Number.isInteger(port)||port<1)throw new Error('Missing local PostgreSQL test port');
  const build=command([process.execPath,'node_modules/typescript/bin/tsc','-p','portable/tsconfig.json'],{stdio:'inherit'});
  if(build.status!==0)process.exitCode=build.status??1;
  else{
    const result=command([process.execPath,'--test','--test-reporter=tap','portable/dist/tests/integration.test.js','portable/dist/tests/product.test.js','portable/dist/tests/operations.test.js'],{env:{...process.env,TEST_DATABASE_URL:`postgresql://postgres:${password}@127.0.0.1:${port}/postgres`},stdio:'inherit'});
    process.exitCode=result.status??1;
  }
}catch(error){process.stderr.write(`${error instanceof Error?error.message:'Native PostgreSQL tests failed'}\n`);process.exitCode=1;}
finally{command(['docker','rm','-f',name]);}
