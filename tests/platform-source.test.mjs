import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,lstat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {App} from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {ApplicationStack} from '../infra/dist/src/stacks.js';
import {RecoveryStack} from '../infra/dist/src/recovery-stack.js';
const fixture={environment:'staging',account:'111122223333',region:'ap-south-1',domain:'staging.example.invalid',zoneId:'Z0000000000000',zoneName:'example.invalid',apiDigest:'sha256:'+'0'.repeat(64),webDigest:'sha256:'+'1'.repeat(64),monthlyBudgetUsd:100,approvedCountries:[],githubRepository:'OWNER/REPOSITORY',githubBranch:'main',alertEmail:'',releaseApproved:false};
const app=()=>new App({context:{'availability-zones:account=111122223333:region=ap-south-1':['ap-south-1a','ap-south-1b']}});
function template(phase){return Template.fromStack(new ApplicationStack(app(),'SourceFixture',{config:{...fixture,bootstrapPhase:phase},env:{account:fixture.account,region:fixture.region}})).toJSON();}
const resources=(data,type)=>Object.entries(data.Resources).filter(([,value])=>value.Type===type);
test('AWS-005 foundation source creates no serving task/image dependency and preserves datastore logical identity',()=>{
 const foundation=template('foundation'),services=template('services');assert.equal(resources(foundation,'AWS::ECS::Service').length,0);assert.equal(resources(foundation,'AWS::ECS::TaskDefinition').length,0);assert.equal(resources(foundation,'AWS::Budgets::Budget').length,1);assert.equal(resources(foundation,'AWS::ECR::Repository').length,2);
 for(const type of ['AWS::RDS::DBInstance','AWS::S3::Bucket','AWS::KMS::Key'])assert.deepEqual(resources(foundation,type).map(([name])=>name),resources(services,type).map(([name])=>name));assert.equal(resources(services,'AWS::ECS::Service').length,3);
});
test('AWS-012/014 support relay secrets are separate and dashboard metrics/heartbeat alarms have real source wiring',()=>{
 const t=template('services'),relay=resources(t,'AWS::Lambda::Function').find(([name])=>name.startsWith('SupportDeliveryRelay'));assert.ok(relay);const variables=relay[1].Properties.Environment.Variables;assert.ok(variables.SIGNING_SECRET_ARN);assert.equal(variables.DB_PASSWORD,undefined);assert.equal(variables.AI_HTTP_API_KEY,undefined);assert.equal(resources(t,'AWS::CloudWatch::Dashboard').length,1);assert.ok(resources(t,'AWS::CloudWatch::Alarm').some(([,r])=>r.Properties.MetricName==='OperationalHeartbeat'&&r.Properties.TreatMissingData==='breaching'));assert.ok(resources(t,'AWS::Lambda::Permission').some(([,r])=>r.Properties.Principal==='sns.amazonaws.com'&&r.Properties.SourceArn));
});
test('AWS-015 recovery resources require a distinct region and grant no application restore access',()=>{
 assert.throws(()=>new RecoveryStack(app(),'BadRecovery',{environment:'staging',sourceRegion:'ap-south-1',sourceAccount:fixture.account,copyRoleName:'owned-copy-role',retentionDays:35,env:{account:fixture.account,region:'ap-south-1'}}),/Distinct|Independent/);
 const t=Template.fromStack(new RecoveryStack(app(),'Recovery',{environment:'staging',sourceRegion:'ap-south-1',sourceAccount:fixture.account,copyRoleName:'owned-copy-role',retentionDays:35,env:{account:fixture.account,region:'eu-west-1'}})).toJSON();assert.equal(resources(t,'AWS::Backup::BackupVault').length,1);assert.ok(JSON.stringify(t).includes('aws:PrincipalArn'));assert.ok(!JSON.stringify(t).includes('StartRestoreJob'));assert.equal(resources(t,'AWS::KMS::Key')[0][1].Properties.EnableKeyRotation,true);
});
test('AUT-009 protected seed CLI creates a private, non-overwritten file and never prints seed material',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fr-operator-cli-')),file=join(dir,'seed.json');try{const args=['portable/scripts/operator-admin.mjs','generate-seed','--output',file,'--label','fixture-operator'];const result=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(result.status,0,result.stderr);const value=JSON.parse(await readFile(file,'utf8'));assert.equal(Buffer.from(value.seedBase64,'base64').length,20);assert.equal((await lstat(file)).mode&0o777,0o600);assert.ok(!result.stdout.includes(value.seedBase64));assert.ok(!result.stdout.includes('otpauth://'));const repeated=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(repeated.status,1);assert.equal((await readFile(file,'utf8')).includes(value.seedBase64),true);}finally{await rm(dir,{recursive:true,force:true});}
});
