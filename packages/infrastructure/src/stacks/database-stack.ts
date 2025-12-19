import * as cdk from "aws-cdk-lib";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import type { AppConfig } from "../lib/config";

export interface DatabaseStackProps extends cdk.StackProps {
  config: AppConfig;
  vpc: ec2.Vpc;
}

export class DatabaseStack extends cdk.Stack {
  public readonly cluster: rds.DatabaseCluster;
  public readonly proxy: rds.DatabaseProxy;

  public readonly dbSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    // Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, "DbSecurityGroup", {
      vpc,
      description: "Security group for RDS PostgreSQL",
      allowAllOutbound: false,
    });

    // RDS Proxy security group (will be created by the proxy)
    // The proxy will handle connections from Lambda

    // Store the secret reference
    const secret = rds.Credentials.fromGeneratedSecret("dbadmin");
    this.dbSecret = secret.secret!;

    // Aurora Serverless v2 cluster
    this.cluster = new rds.DatabaseCluster(this, "Database", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      credentials: secret,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
      removalPolicy:
        props.config.env === "production" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.SNAPSHOT,
      defaultDatabaseName: "honoapp",
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 16,
      writer: rds.ClusterInstance.serverlessV2("writer"),
      readers:
        props.config.env === "production"
          ? [rds.ClusterInstance.serverlessV2("reader")]
          : undefined,
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: "03:00-04:00",
      },
      storageEncrypted: true,
    });

    // RDS Proxy for connection pooling
    this.proxy = this.cluster.addProxy("Proxy", {
      vpc,
      secrets: [this.cluster.secret!],
      debugLogging: props.config.env === "development",
      maxConnectionsPercent: 100,
      borrowTimeout: cdk.Duration.seconds(120),
    });

    // Outputs
    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: this.cluster.clusterEndpoint.hostname,
      exportName: `${props.config.projectName}-db-endpoint-${props.config.env}`,
    });

    new cdk.CfnOutput(this, "ProxyEndpoint", {
      value: this.proxy.endpoint,
      exportName: `${props.config.projectName}-proxy-endpoint-${props.config.env}`,
    });
  }
}
