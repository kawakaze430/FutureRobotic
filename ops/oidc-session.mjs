// Credentials are written only to the protected GitHub job environment, never logged.
import {execFileSync} from 'node:child_process';
import {appendFile} from 'node:fs/promises';
for(const key of ['ACTIONS_ID_TOKEN_REQUEST_URL','ACTIONS_ID_TOKEN_REQUEST_TOKEN','AWS_ROLE_ARN','GITHUB_ENV'])if(!process.env[key])throw new Error('GitHub OIDC environment is incomplete');
const endpoint=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);endpoint.searchParams.set('audience','sts.amazonaws.com');
const response=await fetch(endpoint,{headers:{Authorization:'Bearer '+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('OIDC token unavailable');const {value}=await response.json();
const r=JSON.parse(execFileSync('aws',['sts','assume-role-with-web-identity','--role-arn',process.env.AWS_ROLE_ARN,'--role-session-name','futurerobotic-release','--web-identity-token',value,'--duration-seconds','1800','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));
const c=r.Credentials;if(!c?.SecretAccessKey)throw new Error('Scoped role assumption failed');for(const v of Object.values(c))process.stdout.write(`::add-mask::${v}\n`);await appendFile(process.env.GITHUB_ENV,`AWS_ACCESS_KEY_ID=${c.AccessKeyId}\nAWS_SECRET_ACCESS_KEY=${c.SecretAccessKey}\nAWS_SESSION_TOKEN=${c.SessionToken}\n`);
