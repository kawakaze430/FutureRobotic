import {Stack,RemovalPolicy,CfnOutput,type StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as iam from 'aws-cdk-lib/aws-iam';

/** Independent destination resources, deployed before enabling source-region copy.
 * This stack never restores data or grants the ordinary application restore access. */
export class RecoveryStack extends Stack {
 readonly key:kms.Key;readonly vault:backup.BackupVault;
 constructor(scope:Construct,id:string,props:StackProps&{environment:'staging'|'production';sourceRegion:string;sourceAccount:string;copyRoleName:string;retentionDays:number}){
  super(scope,id,props);
  if(!props.env?.region||props.env.region===props.sourceRegion||!/^\d{12}$/.test(props.sourceAccount)||!Number.isInteger(props.retentionDays)||props.retentionDays<7||props.retentionDays>365)throw Error('Independent approved region/account and bounded recovery retention required');
  const copyRoleArn=`arn:${this.partition}:iam::${props.sourceAccount}:role/${props.copyRoleName}`;
  this.key=new kms.Key(this,'RecoveryKey',{enableKeyRotation:true,removalPolicy:RemovalPolicy.RETAIN,description:`FutureRobotic ${props.environment} recovery copies; no runtime restore grants`});
  // Account delegation plus an exact principal condition avoids a deployment
  // cycle while preventing arbitrary source-account roles from copying/decrypting.
  this.key.addToResourcePolicy(new iam.PolicyStatement({principals:[new iam.AccountPrincipal(props.sourceAccount)],actions:['kms:Encrypt','kms:Decrypt','kms:ReEncrypt*','kms:GenerateDataKey*','kms:DescribeKey'],resources:['*'],conditions:{ArnEquals:{'aws:PrincipalArn':copyRoleArn}}}));
  this.key.addToResourcePolicy(new iam.PolicyStatement({principals:[new iam.AccountPrincipal(props.sourceAccount)],actions:['kms:CreateGrant'],resources:['*'],conditions:{ArnEquals:{'aws:PrincipalArn':copyRoleArn},Bool:{'kms:GrantIsForAWSResource':'true'}}}));
  this.vault=new backup.BackupVault(this,'RecoveryVault',{backupVaultName:`futurerobotic-${props.environment}-recovery`,encryptionKey:this.key,removalPolicy:RemovalPolicy.RETAIN,accessPolicy:new iam.PolicyDocument({statements:[new iam.PolicyStatement({principals:[new iam.AccountPrincipal(props.sourceAccount)],actions:['backup:CopyIntoBackupVault'],resources:['*'],conditions:{ArnEquals:{'aws:PrincipalArn':copyRoleArn}}})]})});
  new CfnOutput(this,'RecoveryVaultArn',{value:this.vault.backupVaultArn});new CfnOutput(this,'RecoveryKeyArn',{value:this.key.keyArn});
 }
}
