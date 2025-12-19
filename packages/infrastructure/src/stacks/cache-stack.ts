import * as cdk from "aws-cdk-lib";
import * as elasticache from "aws-cdk-lib/aws-elasticache";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import type { AppConfig } from "../lib/config";

export interface CacheStackProps extends cdk.StackProps {
  config: AppConfig;
  vpc: ec2.Vpc;
}

export class CacheStack extends cdk.Stack {
  public readonly cluster: elasticache.CfnReplicationGroup;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    // Security group for ElastiCache
    this.securityGroup = new ec2.SecurityGroup(this, "CacheSecurityGroup", {
      vpc,
      description: "Security group for ElastiCache Redis",
      allowAllOutbound: false,
    });

    // Allow access from within VPC (Lambda will be in the same VPC)
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      "Allow Redis access from within VPC"
    );

    // Subnet group
    const subnetGroup = new elasticache.CfnSubnetGroup(this, "SubnetGroup", {
      description: "Subnet group for ElastiCache",
      subnetIds: vpc.privateSubnets.map((subnet) => subnet.subnetId),
    });

    // Redis cluster
    this.cluster = new elasticache.CfnReplicationGroup(this, "RedisCluster", {
      replicationGroupDescription: `Redis cluster for ${props.config.projectName}`,
      engine: "redis",
      cacheNodeType: props.config.env === "production" ? "cache.t3.medium" : "cache.t3.micro",
      numCacheClusters: props.config.env === "production" ? 2 : 1,
      automaticFailoverEnabled: props.config.env === "production",
      multiAzEnabled: props.config.env === "production",
      cacheSubnetGroupName: subnetGroup.ref,
      securityGroupIds: [this.securityGroup.securityGroupId],
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
      removalPolicy:
        props.config.env === "production" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Outputs
    new cdk.CfnOutput(this, "RedisEndpoint", {
      value: this.cluster.attrConfigurationEndPointAddress,
      exportName: `${props.config.projectName}-redis-endpoint-${props.config.env}`,
    });
  }
}
