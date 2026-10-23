import {Stack,Duration,RemovalPolicy,CfnOutput,type StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as asg from 'aws-cdk-lib/aws-autoscaling';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import type {ApplicationStack,ReleaseConfig} from './stacks.js';
// An owner-baked, scanned AMI must already contain Docker, runsc, the pinned
// execution image, Node, gateway systemd unit and PUBLIC capability key only.
// No boot-time package fetch and no application/DB/provider IAM permissions.
export class RunnerStack extends Stack {
 constructor(scope:Construct,id:string,props:StackProps&{config:ReleaseConfig;application:ApplicationStack}){
  super(scope,id,props);const c=props.config;
  if(!c.runnerAmi||!c.runnerCertificateArn||!c.runnerDomain)throw new Error('Approved runner AMI, TLS certificate and private DNS name required');
  const app=props.application.applicationVpc;
  const vpc=new ec2.Vpc(this,'RunnerVpc',{ipAddresses:ec2.IpAddresses.cidr('10.240.0.0/20'),maxAzs:2,natGateways:0,subnetConfiguration:[{name:'Execution',subnetType:ec2.SubnetType.PRIVATE_ISOLATED,cidrMask:24}]});
  const peer=new ec2.CfnVPCPeeringConnection(this,'ControlPlanePeer',{vpcId:app.vpcId,peerVpcId:vpc.vpcId});
  for(const [i,subnet]of app.privateSubnets.entries())new ec2.CfnRoute(this,`ToRunner${i}`,{routeTableId:subnet.routeTable.routeTableId,destinationCidrBlock:vpc.vpcCidrBlock,vpcPeeringConnectionId:peer.ref});
  // Return routes cover application subnets only, never isolated database subnets.
  for(const [i,subnet]of vpc.isolatedSubnets.entries())for(const [j,appSubnet]of app.privateSubnets.entries())new ec2.CfnRoute(this,`Return${i}${j}`,{routeTableId:subnet.routeTable.routeTableId,destinationCidrBlock:appSubnet.ipv4CidrBlock,vpcPeeringConnectionId:peer.ref});
  const edge=new ec2.SecurityGroup(this,'ControlIngress',{vpc,allowAllOutbound:false});
  for(const subnet of app.privateSubnets)edge.addIngressRule(ec2.Peer.ipv4(subnet.ipv4CidrBlock),ec2.Port.tcp(443),'Signed execution requests from private application subnets');
  const hosts=new ec2.SecurityGroup(this,'ExecutionHosts',{vpc,allowAllOutbound:false});
  hosts.addIngressRule(edge,ec2.Port.tcp(8081),'Trusted gateway only');edge.addEgressRule(hosts,ec2.Port.tcp(8081));
  const fleet=new asg.AutoScalingGroup(this,'Fleet',{vpc,vpcSubnets:{subnetType:ec2.SubnetType.PRIVATE_ISOLATED},securityGroup:hosts,instanceType:new ec2.InstanceType('m6i.large'),machineImage:ec2.MachineImage.genericLinux({[c.region]:c.runnerAmi}),minCapacity:0,maxCapacity:2,desiredCapacity:0,requireImdsv2:true,healthCheck:asg.HealthCheck.elb({grace:Duration.minutes(3)}),blockDevices:[{deviceName:'/dev/xvda',volume:asg.BlockDeviceVolume.ebs(30,{encrypted:true,deleteOnTermination:true})}],userData:ec2.UserData.custom('#!/bin/bash\nset -euo pipefail\nsystemctl enable --now futurerobotic-runner.service\n')});
  const loadBalancer=new elb.ApplicationLoadBalancer(this,'PrivateRunnerGateway',{vpc,internetFacing:false,vpcSubnets:{subnetType:ec2.SubnetType.PRIVATE_ISOLATED},securityGroup:edge,dropInvalidHeaderFields:true});
  loadBalancer.addListener('Tls',{port:443,open:false,certificates:[acm.Certificate.fromCertificateArn(this,'Certificate',c.runnerCertificateArn)],sslPolicy:elb.SslPolicy.TLS13_RES})
   .addTargets('Gateway',{port:8081,protocol:elb.ApplicationProtocol.HTTP,targets:[fleet],healthCheck:{path:'/health'},deregistrationDelay:Duration.seconds(20)});
  const zone=new route53.PrivateHostedZone(this,'PrivateDns',{zoneName:c.runnerDomain,vpc});zone.addVpc(app);
  new route53.ARecord(this,'GatewayDns',{zone,target:route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(loadBalancer))});
  new CfnOutput(this,'RunnerEndpoint',{value:`https://${c.runnerDomain}/execute`});new CfnOutput(this,'FleetName',{value:fleet.autoScalingGroupName});
 }
}
