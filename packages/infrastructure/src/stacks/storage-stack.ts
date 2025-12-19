import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import type { AppConfig } from "../lib/config";

export interface StorageStackProps extends cdk.StackProps {
  config: AppConfig;
}

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // S3 bucket with security best practices
    this.bucket = new s3.Bucket(this, "Bucket", {
      bucketName: `${props.config.projectName}-${props.config.env}-${props.config.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy:
        props.config.env === "production" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.config.env !== "production",
      lifecycleRules: [
        {
          id: "DeleteOldVersions",
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
        {
          id: "TransitionToIA",
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      serverAccessLogsPrefix: "access-logs",
    });

    // Enable access logging
    const logBucket = new s3.Bucket(this, "LogBucket", {
      bucketName: `${props.config.projectName}-logs-${props.config.env}-${props.config.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy:
        props.config.env === "production" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.config.env !== "production",
    });

    this.bucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [new cdk.aws_iam.ServicePrincipal("logging.s3.amazonaws.com")],
        actions: ["s3:PutObject"],
        resources: [`${logBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            "s3:x-amz-acl": "bucket-owner-full-control",
          },
        },
      })
    );

    // Outputs
    new cdk.CfnOutput(this, "BucketName", {
      value: this.bucket.bucketName,
      exportName: `${props.config.projectName}-bucket-name-${props.config.env}`,
    });
  }
}
