import {Stack,Duration,RemovalPolicy,Tags,CfnOutput,type StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as waf from 'aws-cdk-lib/aws-wafv2';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as destinations from 'aws-cdk-lib/aws-lambda-destinations';

export interface ReleaseConfig {
 environment:'staging'|'production';account:string;region:string;domain:string;zoneId:string;zoneName:string;
 apiDigest:string;webDigest:string;monthlyBudgetUsd:number;approvedCountries:string[];
 githubRepository:string;githubBranch:string;alertEmail:string;releaseApproved:boolean;supportAckEnabled?:boolean;bootstrapPhase?:'foundation'|'services';recoveryRegion?:string;recoveryRetentionDays?:number;recoveryVaultArn?:string;recoveryKeyArn?:string;aiEnabled?:boolean;billingApproved?:boolean;paddleMode?:'sandbox'|'live';paddlePriceIds?:Record<string,string>;runnerAmi?:string;runnerDomain?:string;runnerCertificateArn?:string;
}
export interface ApplicationProps extends StackProps {config:ReleaseConfig}
export class ApplicationStack extends Stack {
 readonly applicationVpc:ec2.Vpc;readonly alb!:elb.ApplicationLoadBalancer;readonly key:kms.Key;readonly bucket:s3.Bucket;readonly database:rds.DatabaseInstance;readonly alarmTopic!:sns.Topic;
 readonly cluster:ecs.Cluster;readonly apiService!:ecs.FargateService;readonly webService!:ecs.FargateService;readonly workerService!:ecs.FargateService;
 constructor(scope:Construct,id:string,props:ApplicationProps){
  super(scope,id,props);const c=props.config,production=c.environment==='production';Tags.of(this).add('Project','FutureRoboticAI');Tags.of(this).add('Environment',c.environment);
  this.key=new kms.Key(this,'DataKey',{enableKeyRotation:true,removalPolicy:RemovalPolicy.RETAIN});
  const vpc=new ec2.Vpc(this,'Vpc',{maxAzs:2,natGateways:production?2:1,subnetConfiguration:[{name:'Public',subnetType:ec2.SubnetType.PUBLIC,cidrMask:24},{name:'Application',subnetType:ec2.SubnetType.PRIVATE_WITH_EGRESS,cidrMask:24},{name:'Database',subnetType:ec2.SubnetType.PRIVATE_ISOLATED,cidrMask:24}]});
  this.applicationVpc=vpc;
  vpc.addGatewayEndpoint('S3Endpoint',{service:ec2.GatewayVpcEndpointAwsService.S3});
  this.bucket=new s3.Bucket(this,'PrivateFiles',{encryption:s3.BucketEncryption.KMS,encryptionKey:this.key,bucketKeyEnabled:true,blockPublicAccess:s3.BlockPublicAccess.BLOCK_ALL,enforceSSL:true,versioned:true,removalPolicy:RemovalPolicy.RETAIN,lifecycleRules:[{id:'StaleQuarantine',prefix:'quarantine/',expiration:Duration.days(2),noncurrentVersionExpiration:Duration.days(7),abortIncompleteMultipartUploadAfter:Duration.days(1)}]});
  const dbSg=new ec2.SecurityGroup(this,'DatabaseSg',{vpc,allowAllOutbound:false});
  this.database=new rds.DatabaseInstance(this,'Postgres',{vpc,vpcSubnets:{subnetType:ec2.SubnetType.PRIVATE_ISOLATED},engine:rds.DatabaseInstanceEngine.postgres({version:rds.PostgresEngineVersion.VER_16}),instanceType:ec2.InstanceType.of(ec2.InstanceClass.T4G,production?ec2.InstanceSize.MEDIUM:ec2.InstanceSize.SMALL),credentials:rds.Credentials.fromGeneratedSecret('fr_migrator',{encryptionKey:this.key}),databaseName:'futurerobotic',multiAz:production,storageEncrypted:true,storageEncryptionKey:this.key,allocatedStorage:20,maxAllocatedStorage:100,backupRetention:Duration.days(production?35:7),deletionProtection:production,publiclyAccessible:false,securityGroups:[dbSg],cloudwatchLogsExports:['postgresql','upgrade'],autoMinorVersionUpgrade:true,removalPolicy:RemovalPolicy.RETAIN});
  const runtimeDb=new secrets.Secret(this,'RuntimeDatabaseSecret',{encryptionKey:this.key,generateSecretString:{secretStringTemplate:JSON.stringify({username:'fr_runtime'}),generateStringKey:'password',excludePunctuation:true,passwordLength:48}});
  // This secret is populated/validated by the owner-controlled release setup. No
  // provider key is placed in source, template parameters, outputs or browser assets.
  const appSecret=secrets.Secret.fromSecretNameV2(this,'ApplicationSecrets',`futurerobotic/${c.environment}/application`);
  const providerSecret=secrets.Secret.fromSecretNameV2(this,'ProviderSecrets',`futurerobotic/${c.environment}/provider`);
  const dlq=new sqs.Queue(this,'WakeupDeadLetters',{encryption:sqs.QueueEncryption.KMS,encryptionMasterKey:this.key,enforceSSL:true,retentionPeriod:Duration.days(14)});
  const queue=new sqs.Queue(this,'WakeupQueue',{encryption:sqs.QueueEncryption.KMS,encryptionMasterKey:this.key,enforceSSL:true,visibilityTimeout:Duration.seconds(60),retentionPeriod:Duration.days(4),deadLetterQueue:{queue:dlq,maxReceiveCount:5}});
  this.cluster=new ecs.Cluster(this,'Cluster',{vpc,containerInsightsV2:ecs.ContainerInsights.ENABLED});
  const applicationSg=new ec2.SecurityGroup(this,'ApplicationSg',{vpc,allowAllOutbound:true});
  const webSg=new ec2.SecurityGroup(this,'WebSg',{vpc,allowAllOutbound:true});
  dbSg.addIngressRule(applicationSg,ec2.Port.tcp(5432),'Application database connections only');
  const apiRepo=new ecr.Repository(this,'ApiImages',{imageScanOnPush:true,imageTagMutability:ecr.TagMutability.IMMUTABLE,encryption:ecr.RepositoryEncryption.KMS,encryptionKey:this.key,removalPolicy:RemovalPolicy.RETAIN,lifecycleRules:[{maxImageCount:30}]});
  const webRepo=new ecr.Repository(this,'WebImages',{imageScanOnPush:true,imageTagMutability:ecr.TagMutability.IMMUTABLE,encryption:ecr.RepositoryEncryption.KMS,encryptionKey:this.key,removalPolicy:RemovalPolicy.RETAIN,lifecycleRules:[{maxImageCount:30}]});
  this.alarmTopic=new sns.Topic(this,'Alerts',{masterKey:this.key});
  if(c.alertEmail)this.alarmTopic.addSubscription(new subscriptions.EmailSubscription(c.alertEmail));
  const budget=new budgets.CfnBudget(this,'MonthlyBudget',{budget:{budgetName:`futurerobotic-${c.environment}`,budgetType:'COST',timeUnit:'MONTHLY',budgetLimit:{amount:c.monthlyBudgetUsd,unit:'USD'},costFilters:{TagKeyValue:[`user:Project$FutureRoboticAI`]}},notificationsWithSubscribers:[{notification:{comparisonOperator:'GREATER_THAN',notificationType:'ACTUAL',threshold:80,thresholdType:'PERCENTAGE'},subscribers:[{subscriptionType:'SNS',address:this.alarmTopic.topicArn}]}]});
  this.alarmTopic.addToResourcePolicy(new iam.PolicyStatement({principals:[new iam.ServicePrincipal('budgets.amazonaws.com')],actions:['sns:Publish'],resources:[this.alarmTopic.topicArn],conditions:{StringEquals:{'aws:SourceAccount':c.account}}}));
  this.key.addToResourcePolicy(new iam.PolicyStatement({principals:[new iam.ServicePrincipal(`logs.${c.region}.amazonaws.com`),new iam.ServicePrincipal('cloudwatch.amazonaws.com'),new iam.ServicePrincipal('budgets.amazonaws.com')],actions:['kms:Decrypt','kms:GenerateDataKey*','kms:Encrypt','kms:DescribeKey'],resources:['*'],conditions:{StringEquals:{'aws:SourceAccount':c.account}}}));
  const supportEvents=new sns.Topic(this,'SupportDeliveryEvents',{masterKey:this.key});
  const supportSigning=new secrets.Secret(this,'SupportDeliverySigning',{encryptionKey:this.key,generateSecretString:{secretStringTemplate:'{}',generateStringKey:'current',passwordLength:48,excludePunctuation:true}});
  const supportDlq=new sqs.Queue(this,'SupportDeliveryDeadLetters',{encryption:sqs.QueueEncryption.KMS,encryptionMasterKey:this.key,enforceSSL:true,retentionPeriod:Duration.days(14)});
  const emailConfig=new ses.ConfigurationSet(this,'EmailConfiguration');emailConfig.addEventDestination('DeliveryEvents',{events:[ses.EmailSendingEvent.SEND,ses.EmailSendingEvent.BOUNCE,ses.EmailSendingEvent.COMPLAINT,ses.EmailSendingEvent.DELIVERY],destination:ses.EventDestination.snsTopic(supportEvents)});
  const supportRelay=new lambda.Function(this,'SupportDeliveryRelay',{runtime:lambda.Runtime.NODEJS_22_X,handler:'index.handler',code:lambda.Code.fromAsset('ops/lambda/support-events'),timeout:Duration.seconds(30),memorySize:256,environment:{TOPIC_ARN:supportEvents.topicArn,APP_ORIGIN:`https://${c.domain}`,SIGNING_SECRET_ARN:supportSigning.secretArn},onFailure:new destinations.SqsDestination(supportDlq),retryAttempts:2});
  supportSigning.grantRead(supportRelay);supportEvents.addSubscription(new subscriptions.LambdaSubscription(supportRelay));
  if(c.bootstrapPhase==='foundation'){
   // First apply needs no image and creates no serving tasks. Update this SAME
   // stack after publishing reviewed images and running the isolated migrator.
   new CfnOutput(this,'RuntimeDatabaseSecretArn',{value:runtimeDb.secretArn});new CfnOutput(this,'MigrationSecretArn',{value:this.database.secret!.secretArn});new CfnOutput(this,'DatabaseHostname',{value:this.database.dbInstanceEndpointAddress});new CfnOutput(this,'PrivateFilesBucket',{value:this.bucket.bucketName});new CfnOutput(this,'ClusterName',{value:this.cluster.clusterName});new CfnOutput(this,'ApiRepository',{value:apiRepo.repositoryUri});new CfnOutput(this,'WebRepository',{value:webRepo.repositoryUri});new CfnOutput(this,'ApplicationSubnets',{value:vpc.privateSubnets.map(s=>s.subnetId).join(',')});new CfnOutput(this,'ApplicationSecurityGroup',{value:applicationSg.securityGroupId});
   return;
  }
  this.alb=new elb.ApplicationLoadBalancer(this,'PrivateAlb',{vpc,internetFacing:false,vpcSubnets:{subnetType:ec2.SubnetType.PRIVATE_WITH_EGRESS},dropInvalidHeaderFields:true,deletionProtection:production});
  // CloudFront VPC-origin ENIs use private VPC addresses; the ALB has no public path.
  this.alb.connections.allowFrom(ec2.Peer.ipv4(vpc.vpcCidrBlock),ec2.Port.tcp(80),'CloudFront private origin connectivity; tighten to its managed SG after creation');
  const listener=this.alb.addListener('Http',{port:80,open:false});
  const deploymentPassRoles:iam.IRole[]=[];
  const services:Record<string,ecs.FargateService>={};const logGroups:logs.LogGroup[]=[];
  for(const name of ['api','worker','web'] as const){
   const task=new ecs.FargateTaskDefinition(this,`${name}Task`,{cpu:512,memoryLimitMiB:1024,runtimePlatform:{cpuArchitecture:ecs.CpuArchitecture.X86_64,operatingSystemFamily:ecs.OperatingSystemFamily.LINUX}});
   const group=new logs.LogGroup(this,`${name}Logs`,{encryptionKey:this.key,retention:logs.RetentionDays.ONE_MONTH,removalPolicy:RemovalPolicy.RETAIN});logGroups.push(group);
   const environment:Record<string,string>=name==='web'?{}:{NODE_ENV:'production',APP_ENVIRONMENT:c.environment,SUPPORT_ACK_ENABLED:String(c.supportAckEnabled===true),SUPPORT_CONFIGURATION_SET:emailConfig.configurationSetName,HOST:'0.0.0.0',PROCESS_ROLE:name,APP_ORIGIN:`https://${c.domain}`,AWS_REGION:c.region,DB_HOSTNAME:this.database.dbInstanceEndpointAddress,DB_DATABASE:'futurerobotic',PG_CA_FILE:'/app/portable/certs/rds-global-bundle.pem',DB_POOL_MAX:'10',TRUSTED_EDGE_HOPS:'2',S3_BUCKET:this.bucket.bucketName,S3_KMS_KEY_ARN:this.key.keyArn,WAKEUP_QUEUE_URL:queue.queueUrl,RELEASE_CONFIGURATION_APPROVED:String(c.releaseApproved),AI_ENABLED:String(c.aiEnabled===true),BILLING_RELEASE_APPROVED:String(c.billingApproved===true),PADDLE_MODE:c.paddleMode??'sandbox',PADDLE_PRICE_IDS_JSON:JSON.stringify(c.paddlePriceIds??{}),APPROVED_COUNTRIES:c.approvedCountries.join(',')};
   if(name==='worker'&&c.runnerDomain)environment.RUNNER_ENDPOINT=`https://${c.runnerDomain}/execute`;
   const runtimeSecrets:Record<string,ecs.Secret>=name==='web'?{}:{DB_USERNAME:ecs.Secret.fromSecretsManager(runtimeDb,'username'),DB_PASSWORD:ecs.Secret.fromSecretsManager(runtimeDb,'password'),APP_ENCRYPTION_KEY:ecs.Secret.fromSecretsManager(appSecret,'APP_ENCRYPTION_KEY'),AUTH_HASH_SECRET:ecs.Secret.fromSecretsManager(appSecret,'AUTH_HASH_SECRET')};
   if(name==='api')runtimeSecrets.SUPPORT_EVENT_SECRET_JSON=ecs.Secret.fromSecretsManager(supportSigning);
   if(name==='worker'&&c.supportAckEnabled){runtimeSecrets.SES_FROM_EMAIL=ecs.Secret.fromSecretsManager(appSecret,'SES_FROM_EMAIL');task.addToTaskRolePolicy(new iam.PolicyStatement({actions:['ses:SendEmail'],resources:[`arn:${this.partition}:ses:${c.region}:${c.account}:identity/${c.zoneName}`]}));}
   if(name==='api')for(const field of ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET','TURNSTILE_SECRET','TURNSTILE_SITE_KEY','SES_FROM_EMAIL','PADDLE_API_KEY','PADDLE_WEBHOOK_SECRET'])runtimeSecrets[field]=ecs.Secret.fromSecretsManager(appSecret,field);
   if(name==='worker'&&c.runnerDomain)runtimeSecrets.RUNNER_SIGNING_KEY=ecs.Secret.fromSecretsManager(appSecret,'RUNNER_SIGNING_KEY');
   if(name==='worker')for(const field of ['AI_HTTP_ENDPOINT','AI_HTTP_API_KEY','AI_MODELS_JSON','AI_INPUT_MICRO_USD_PER_MILLION','AI_OUTPUT_MICRO_USD_PER_MILLION','AI_RETENTION_APPROVED'])runtimeSecrets[field]=ecs.Secret.fromSecretsManager(providerSecret,field);
   const container=task.addContainer(name,{image:ecs.ContainerImage.fromRegistry(`${name==='web'?webRepo.repositoryUri:apiRepo.repositoryUri}@${name==='web'?c.webDigest:c.apiDigest}`),environment,secrets:runtimeSecrets,logging:ecs.LogDrivers.awsLogs({logGroup:group,streamPrefix:name}),readonlyRootFilesystem:true,user:name==='web'?'101':'1000',linuxParameters:new ecs.LinuxParameters(this,`${name}Linux`,{initProcessEnabled:true}),healthCheck:{command:name==='worker'?['CMD-SHELL',"node -e \"const f=require('fs');process.exit(Date.now()-f.statSync('/tmp/fr-worker-heartbeat').mtimeMs<90000?0:1)\""]:name==='api'?['CMD-SHELL',"node -e \"fetch('http://127.0.0.1:3001/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\""]:['CMD-SHELL','wget -q -O /dev/null http://127.0.0.1:8080/health'],interval:Duration.seconds(30),timeout:Duration.seconds(5),startPeriod:Duration.seconds(60)}});
   task.addVolume({name:'temporary'});container.addMountPoints({containerPath:'/tmp',sourceVolume:'temporary',readOnly:false});
   if(name!=='worker')container.addPortMappings({containerPort:name==='web'?8080:3001});
   deploymentPassRoles.push(task.taskRole,task.executionRole!);
   apiRepo.grantPull(task.executionRole!);webRepo.grantPull(task.executionRole!);
   if(name!=='web'){this.bucket.grantReadWrite(task.taskRole);this.key.grantEncryptDecrypt(task.taskRole);}
   if(name==='api'){queue.grantSendMessages(task.taskRole);task.addToTaskRolePolicy(new iam.PolicyStatement({actions:['ses:SendEmail'],resources:[`arn:aws:ses:${c.region}:${c.account}:identity/${c.zoneName}`]}));}
   if(name==='worker')queue.grantConsumeMessages(task.taskRole);
   services[name]=new ecs.FargateService(this,`${name}Service`,{cluster:this.cluster,taskDefinition:task,desiredCount:production?2:1,assignPublicIp:false,vpcSubnets:{subnetType:ec2.SubnetType.PRIVATE_WITH_EGRESS},securityGroups:[name==='web'?webSg:applicationSg],circuitBreaker:{rollback:true},minHealthyPercent:100,maxHealthyPercent:200,healthCheckGracePeriod:name==='worker'?undefined:Duration.seconds(60),enableExecuteCommand:false});
   services[name].autoScaleTaskCount({minCapacity:production?2:1,maxCapacity:production?6:2}).scaleOnCpuUtilization(`${name}CpuScaling`,{targetUtilizationPercent:60,scaleInCooldown:Duration.seconds(180),scaleOutCooldown:Duration.seconds(60)});
  }
  this.apiService=services.api;this.webService=services.web;this.workerService=services.worker;
  listener.addTargets('Web',{port:8080,protocol:elb.ApplicationProtocol.HTTP,targets:[this.webService],healthCheck:{path:'/health'}});
  listener.addTargets('Api',{priority:10,conditions:[elb.ListenerCondition.pathPatterns(['/v1/*','/auth/*','/api/*','/webhooks/*','/ready'])],port:3001,protocol:elb.ApplicationProtocol.HTTP,targets:[this.apiService],healthCheck:{path:'/ready',healthyHttpCodes:'200'}});
  listener.addTargets('ApiSchema',{priority:11,conditions:[elb.ListenerCondition.pathPatterns(['/openapi.json','/health'])],port:3001,protocol:elb.ApplicationProtocol.HTTP,targets:[this.apiService],healthCheck:{path:'/ready',healthyHttpCodes:'200'}});
  const alarms=[new cw.Alarm(this,'Alb5xx',{metric:this.alb.metrics.httpCodeElb(elb.HttpCodeElb.ELB_5XX_COUNT),threshold:5,evaluationPeriods:2,treatMissingData:cw.TreatMissingData.NOT_BREACHING}),new cw.Alarm(this,'QueueAge',{metric:queue.metricApproximateAgeOfOldestMessage(),threshold:120,evaluationPeriods:2}),new cw.Alarm(this,'DeadLetterAlarm',{metric:dlq.metricApproximateNumberOfMessagesVisible(),threshold:1,evaluationPeriods:1}),new cw.Alarm(this,'DatabaseCpu',{metric:this.database.metricCPUUtilization(),threshold:80,evaluationPeriods:3}),new cw.Alarm(this,'DatabaseConnections',{metric:this.database.metricDatabaseConnections(),threshold:150,evaluationPeriods:2})];
  for(const [index,group]of logGroups.entries()){
   const metric=new logs.MetricFilter(this,`Failures${index}`,{logGroup:group,filterPattern:logs.FilterPattern.any(logs.FilterPattern.stringValue('$.event','=','provider.failed'),logs.FilterPattern.stringValue('$.event','=','job.failed'),logs.FilterPattern.numberValue('$.status','>=',500)),metricNamespace:`FutureRobotic/${c.environment}`,metricName:`ServiceFailures${index}`,metricValue:'1'});
   alarms.push(new cw.Alarm(this,`ServiceFailureAlarm${index}`,{metric:metric.metric(),threshold:5,evaluationPeriods:2,treatMissingData:cw.TreatMissingData.NOT_BREACHING}));
  }
  const namespace=`FutureRobotic/${c.environment}`;
  const latencyFilter=new logs.MetricFilter(this,'ApiLatency',{logGroup:logGroups[0],filterPattern:logs.FilterPattern.all(logs.FilterPattern.stringValue('$.event','=','api.completed'),logs.FilterPattern.exists('$.durationMs')),metricNamespace:namespace,metricName:'ApiDurationMs',metricValue:'$.durationMs',unit:cw.Unit.MILLISECONDS});
  const latency=latencyFilter.metric({statistic:'p95',period:Duration.minutes(5)});
  alarms.push(new cw.Alarm(this,'ApiLatencyAlarm',{metric:latency,threshold:2500,evaluationPeriods:3,treatMissingData:cw.TreatMissingData.NOT_BREACHING}));
  const metric=(name:string,statistic='Maximum')=>new cw.Metric({namespace,metricName:name,dimensionsMap:{Environment:c.environment},period:Duration.minutes(5),statistic});
  const uncertain=metric('UncertainDispatches'),providerBudget=metric('EstimatedSpendPercent'),durableAge=metric('DurableQueueOldestSeconds');
  alarms.push(new cw.Alarm(this,'UncertainDispatchesAlarm',{metric:uncertain,threshold:1,evaluationPeriods:1,treatMissingData:cw.TreatMissingData.NOT_BREACHING}),new cw.Alarm(this,'ProviderEstimateBudgetAlarm',{metric:providerBudget,threshold:80,evaluationPeriods:1,treatMissingData:cw.TreatMissingData.NOT_BREACHING}),new cw.Alarm(this,'DurableQueueAgeAlarm',{metric:durableAge,threshold:120,evaluationPeriods:2,treatMissingData:cw.TreatMissingData.NOT_BREACHING}));
  alarms.push(new cw.Alarm(this,'OperationalHeartbeatAlarm',{metric:metric('OperationalHeartbeat'),threshold:1,comparisonOperator:cw.ComparisonOperator.LESS_THAN_THRESHOLD,evaluationPeriods:2,treatMissingData:cw.TreatMissingData.BREACHING}));
  const dashboard=new cw.Dashboard(this,'OperationsDashboard',{dashboardName:`FutureRobotic-${c.environment}`});
  dashboard.addWidgets(new cw.TextWidget({markdown:'Operational metadata only. Provider spend is reserved/estimated, not an invoice. Missing metrics do not prove health. Alert delivery and response must be rehearsed.',width:24,height:2}),new cw.GraphWidget({title:'API p95 latency and ALB errors',left:[latency],right:[this.alb.metrics.httpCodeElb(elb.HttpCodeElb.ELB_5XX_COUNT)],width:12}),new cw.GraphWidget({title:'Wakeup / durable queue age and dead letters',left:[queue.metricApproximateAgeOfOldestMessage(),durableAge],right:[dlq.metricApproximateNumberOfMessagesVisible()],width:12}),new cw.GraphWidget({title:'Database CPU and connections',left:[this.database.metricCPUUtilization()],right:[this.database.metricDatabaseConnections()],width:12}),new cw.GraphWidget({title:'Provider estimates and uncertain outcomes',left:[providerBudget],right:[uncertain],width:12}));
  alarms.forEach(alarm=>alarm.addAlarmAction(new actions.SnsAction(this.alarmTopic)));

  const zone=route53.HostedZone.fromHostedZoneAttributes(this,'Zone',{hostedZoneId:c.zoneId,zoneName:c.zoneName});
  const email=new ses.EmailIdentity(this,'SenderIdentity',{identity:ses.Identity.publicHostedZone(zone)});

  const vault=new backup.BackupVault(this,'BackupVault',{encryptionKey:this.key,removalPolicy:RemovalPolicy.RETAIN});
  const plan=new backup.BackupPlan(this,'BackupPlan',{backupPlanName:`FutureRobotic-${c.environment}`,backupVault:vault});plan.addRule(new backup.BackupPlanRule({ruleName:'DailyEncryptedBackup',deleteAfter:Duration.days(35),enableContinuousBackup:true}));plan.addSelection('DatabaseAndFiles',{resources:[backup.BackupResource.fromRdsDatabaseInstance(this.database),backup.BackupResource.fromArn(this.bucket.bucketArn)]});
  if(c.recoveryVaultArn&&c.recoveryKeyArn){
   if(!c.recoveryRegion||c.recoveryRegion===c.region)throw Error('Distinct recovery region required');
   const copyRole=new iam.Role(this,'RecoveryCopyRole',{roleName:`FutureRobotic-${c.environment}-backup-copy`,assumedBy:new iam.ServicePrincipal('backup.amazonaws.com'),managedPolicies:[iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBackupServiceRolePolicyForBackup')]});
   this.key.grantDecrypt(copyRole);
   copyRole.addToPolicy(new iam.PolicyStatement({actions:['backup:CopyIntoBackupVault'],resources:[c.recoveryVaultArn]}));
   copyRole.addToPolicy(new iam.PolicyStatement({actions:['kms:Encrypt','kms:Decrypt','kms:ReEncrypt*','kms:GenerateDataKey*','kms:DescribeKey'],resources:[c.recoveryKeyArn]}));
   copyRole.addToPolicy(new iam.PolicyStatement({actions:['kms:CreateGrant'],resources:[c.recoveryKeyArn],conditions:{Bool:{'kms:GrantIsForAWSResource':'true'}}}));
   const destination=backup.BackupVault.fromBackupVaultArn(this,'RecoveryDestination',c.recoveryVaultArn);
   const regional=new backup.BackupPlan(this,'RegionalRdsCopies',{backupVault:vault,backupPlanName:`FutureRobotic-${c.environment}-regional-rds`});
   regional.addRule(new backup.BackupPlanRule({ruleName:'DailyRdsSnapshotCopy',deleteAfter:Duration.days(35),copyActions:[{destinationBackupVault:destination,deleteAfter:Duration.days(c.recoveryRetentionDays??35)}]}));
   regional.addSelection('RdsOnly',{resources:[backup.BackupResource.fromRdsDatabaseInstance(this.database)],role:copyRole});
   // S3 versions require a separately reviewed replication/restore policy. Do
   // not pretend an RDS snapshot-copy rule also establishes S3 regional parity.
  }
  const github=new iam.OpenIdConnectProvider(this,'GithubOidc',{url:'https://token.actions.githubusercontent.com',clientIds:['sts.amazonaws.com']});
  const deployRole=new iam.Role(this,'GithubDeployRole',{assumedBy:new iam.WebIdentityPrincipal(github.openIdConnectProviderArn,{StringEquals:{'token.actions.githubusercontent.com:aud':'sts.amazonaws.com','token.actions.githubusercontent.com:sub':`repo:${c.githubRepository}:environment:${c.environment}`}}),maxSessionDuration:Duration.hours(1)});
  deployRole.addToPolicy(new iam.PolicyStatement({actions:['ecr:GetAuthorizationToken'],resources:['*']}));
  deployRole.addToPolicy(new iam.PolicyStatement({actions:['ecs:DescribeTaskDefinition'],resources:['*']}));
  deployRole.addToPolicy(new iam.PolicyStatement({actions:['ecs:RegisterTaskDefinition'],resources:['*'],conditions:{StringEquals:{'aws:RequestTag/Project':'FutureRoboticAI'}}}));
  deployRole.addToPolicy(new iam.PolicyStatement({actions:['ecs:TagResource'],resources:[`arn:aws:ecs:${c.region}:${c.account}:task-definition/*`],conditions:{StringEquals:{'aws:RequestTag/Project':'FutureRoboticAI'}}}));
  deployRole.addToPolicy(new iam.PolicyStatement({actions:['iam:PassRole'],resources:deploymentPassRoles.map(r=>r.roleArn),conditions:{StringEquals:{'iam:PassedToService':'ecs-tasks.amazonaws.com'}}}));
  apiRepo.grantPullPush(deployRole);webRepo.grantPullPush(deployRole);
  deployRole.addToPolicy(new iam.PolicyStatement({actions:['ecs:DescribeServices','ecs:UpdateService'],resources:[this.apiService.serviceArn,this.webService.serviceArn,this.workerService.serviceArn]}));
  new CfnOutput(this,'RuntimeDatabaseSecretArn',{value:runtimeDb.secretArn});new CfnOutput(this,'MigrationSecretArn',{value:this.database.secret!.secretArn});new CfnOutput(this,'PrivateFilesBucket',{value:this.bucket.bucketName});new CfnOutput(this,'ClusterName',{value:this.cluster.clusterName});new CfnOutput(this,'DeployRoleArn',{value:deployRole.roleArn});new CfnOutput(this,'ApiRepository',{value:apiRepo.repositoryUri});new CfnOutput(this,'WebRepository',{value:webRepo.repositoryUri});
 }
}
export class EdgeStack extends Stack {
 constructor(scope:Construct,id:string,props:StackProps&{config:ReleaseConfig;application:ApplicationStack}){
  super(scope,id,props);const c=props.config;Tags.of(this).add('Project','FutureRoboticAI');
  const zone=route53.HostedZone.fromHostedZoneAttributes(this,'Zone',{hostedZoneId:c.zoneId,zoneName:c.zoneName});
  const certificate=new acm.Certificate(this,'EdgeCertificate',{domainName:c.domain,validation:acm.CertificateValidation.fromDns(zone)});
  const origin=new cf.CfnVpcOrigin(this,'PrivateOrigin',{vpcOriginEndpointConfig:{arn:props.application.alb.loadBalancerArn,name:`FutureRobotic-${c.environment}`,httpPort:80,httpsPort:443,originProtocolPolicy:'http-only'}});
  const webAcl=new waf.CfnWebACL(this,'Waf',{scope:'CLOUDFRONT',defaultAction:{allow:{}},visibilityConfig:{cloudWatchMetricsEnabled:true,sampledRequestsEnabled:false,metricName:`FutureRobotic-${c.environment}`},rules:[{name:'RequestRate',priority:1,action:{block:{}},statement:{rateBasedStatement:{aggregateKeyType:'IP',limit:1000,evaluationWindowSec:300}},visibilityConfig:{cloudWatchMetricsEnabled:true,sampledRequestsEnabled:false,metricName:'RequestRate'}},{name:'AuthRate',priority:2,action:{block:{}},statement:{rateBasedStatement:{aggregateKeyType:'IP',limit:100,evaluationWindowSec:300,scopeDownStatement:{byteMatchStatement:{fieldToMatch:{uriPath:{}},positionalConstraint:'STARTS_WITH',searchString:'/auth/',textTransformations:[{priority:0,type:'NONE'}]}}}},visibilityConfig:{cloudWatchMetricsEnabled:true,sampledRequestsEnabled:false,metricName:'AuthRate'}},{name:'KnownMaliciousIps',priority:3,overrideAction:{none:{}},statement:{managedRuleGroupStatement:{vendorName:'AWS',name:'AWSManagedRulesAmazonIpReputationList'}},visibilityConfig:{cloudWatchMetricsEnabled:true,sampledRequestsEnabled:false,metricName:'BadIps'}}]});
  const dynamic={targetOriginId:'app',viewerProtocolPolicy:'redirect-to-https',allowedMethods:['GET','HEAD','OPTIONS','PUT','POST','PATCH','DELETE'],cachedMethods:['GET','HEAD'],cachePolicyId:'413f160d-6f48-4b7d-b948-b3c3cc178a5e',originRequestPolicyId:'216adef6-5c7f-47e4-b989-5492eafa07d3',compress:true};
  const distribution=new cf.CfnDistribution(this,'Distribution',{distributionConfig:{enabled:true,aliases:[c.domain],httpVersion:'http2and3',ipv6Enabled:true,webAclId:webAcl.attrArn,origins:[{id:'app',domainName:props.application.alb.loadBalancerDnsName,vpcOriginConfig:{vpcOriginId:origin.attrId,originReadTimeout:60,originKeepaliveTimeout:60}}],defaultCacheBehavior:dynamic,cacheBehaviors:[{...dynamic,pathPattern:'/assets/*',allowedMethods:['GET','HEAD','OPTIONS'],cachePolicyId:'658327ea-f89d-4fab-a63d-7e88639e58f6'}],viewerCertificate:{acmCertificateArn:certificate.certificateArn,sslSupportMethod:'sni-only',minimumProtocolVersion:'TLSv1.2_2021'},priceClass:'PriceClass_All'}});
  new route53.ARecord(this,'Domain',{zone,recordName:c.domain,target:route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cf.Distribution.fromDistributionAttributes(this,'DistributionAlias',{domainName:distribution.attrDomainName,distributionId:distribution.ref})))});
  new CfnOutput(this,'Url',{value:`https://${c.domain}`});new CfnOutput(this,'DistributionId',{value:distribution.ref});
 }
}
