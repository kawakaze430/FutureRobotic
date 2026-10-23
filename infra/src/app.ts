import {App} from 'aws-cdk-lib';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {RunnerStack} from './runner-stack.js';
import {ApplicationStack,EdgeStack,type ReleaseConfig} from './stacks.js';
const synthOnly=process.env.INFRA_SYNTH_ONLY==='true';
const app=new App({outdir:resolve(process.env.CDK_OUTDIR??'outputs/cdk'),context:{'availability-zones:account=111122223333:region=ap-south-1':['ap-south-1a','ap-south-1b']}});
let configs:ReleaseConfig[];
if(synthOnly)configs=(['staging','production'] as const).map(environment=>({environment,account:'111122223333',region:'ap-south-1',domain:`${environment}.example.invalid`,zoneId:'Z0000000000000',zoneName:'example.invalid',apiDigest:'sha256:'+'0'.repeat(64),webDigest:'sha256:'+'1'.repeat(64),monthlyBudgetUsd:100,approvedCountries:[],githubRepository:'OWNER/REPOSITORY',githubBranch:'main',alertEmail:'',releaseApproved:false,runnerAmi:'ami-0123456789abcdef0',runnerDomain:`runner.${environment}.example.invalid`,runnerCertificateArn:'arn:aws:acm:ap-south-1:111122223333:certificate/00000000-0000-0000-0000-000000000000'}));
else{
 if(!process.env.RELEASE_CONFIG_FILE)throw new Error('Set RELEASE_CONFIG_FILE to owner-reviewed configuration, or INFRA_SYNTH_ONLY=true for offline synthesis');
 configs=JSON.parse(readFileSync(process.env.RELEASE_CONFIG_FILE,'utf8'));
 for(const c of configs){if(!['staging','production'].includes(c.environment)||!/^\d{12}$/.test(c.account)||!c.releaseApproved||!/^sha256:[a-f0-9]{64}$/.test(c.apiDigest)||!/^sha256:[a-f0-9]{64}$/.test(c.webDigest)||c.domain.endsWith('.invalid')||!c.zoneId||c.monthlyBudgetUsd<=0||!c.githubRepository.includes('/'))throw new Error('Release configuration is incomplete or unapproved');}
}
for(const config of configs){const application=new ApplicationStack(app,`FutureRobotic-${config.environment}`,{config,env:{account:config.account,region:config.region},crossRegionReferences:true});if(config.runnerAmi)new RunnerStack(app,`FutureRobotic-${config.environment}-runner`,{config,application,env:{account:config.account,region:config.region}});new EdgeStack(app,`FutureRobotic-${config.environment}-edge`,{config,application,env:{account:config.account,region:'us-east-1'},crossRegionReferences:true});}
app.synth();console.log(JSON.stringify({mode:synthOnly?'offline-unapproved-fixture':'owner-configured',stacks:configs.reduce((n,c)=>n+2+(c.runnerAmi?1:0),0),output:app.outdir,deployed:false}));
