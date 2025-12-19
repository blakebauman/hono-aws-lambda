import { IAspect } from "aws-cdk-lib";
import { Annotations } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as rds from "aws-cdk-lib/aws-rds";

export class SecurityValidationAspect implements IAspect {
  visit(node: IConstruct): void {
    // Check for public S3 buckets
    if (node instanceof s3.Bucket) {
      if (!node.isWebsite) {
        const publicAccessBlock = node.node.tryFindChild("PublicAccessBlock");
        if (!publicAccessBlock) {
          Annotations.of(node).addWarning("S3 bucket should have public access blocked");
        }
      }
    }

    // Check for unencrypted RDS instances
    if (node instanceof rds.DatabaseInstance || node instanceof rds.DatabaseCluster) {
      if (!node.encryptionKey) {
        Annotations.of(node).addWarning("RDS instance should be encrypted");
      }
    }
  }
}
