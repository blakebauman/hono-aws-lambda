import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface SecureS3Props {
  removalPolicy?: cdk.RemovalPolicy;
}

export class SecureS3 extends s3.Bucket {
  constructor(scope: Construct, id: string, props: SecureS3Props = {}) {
    super(scope, id, {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: props.removalPolicy || cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.removalPolicy === cdk.RemovalPolicy.DESTROY,
    });
  }
}
