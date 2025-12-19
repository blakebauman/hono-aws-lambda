import * as cdk from "aws-cdk-lib";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export interface SecureRdsProps {
  vpc: ec2.IVpc;
  removalPolicy?: cdk.RemovalPolicy;
}

export class SecureRds extends rds.DatabaseCluster {
  constructor(scope: Construct, id: string, props: SecureRdsProps) {
    super(scope, id, {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      credentials: rds.Credentials.fromGeneratedSecret("dbadmin"),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      removalPolicy: props.removalPolicy || cdk.RemovalPolicy.SNAPSHOT,
      storageEncrypted: true,
      backup: {
        retention: cdk.Duration.days(7),
      },
    });
  }
}
