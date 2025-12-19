import { IAspect } from "aws-cdk-lib";
import { Annotations } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as rds from "aws-cdk-lib/aws-rds";
import * as lambda from "aws-cdk-lib/aws-lambda";

export class ComplianceAspect implements IAspect {
  visit(node: IConstruct): void {
    // Ensure encryption is enabled
    if (node instanceof s3.Bucket) {
      if (!node.encryptionKey && !node.encryption) {
        Annotations.of(node).addError("S3 bucket must have encryption enabled for compliance");
      }
    }

    if (node instanceof rds.DatabaseInstance || node instanceof rds.DatabaseCluster) {
      if (!node.encryptionKey) {
        Annotations.of(node).addError("RDS instance must be encrypted for compliance");
      }
    }

    // Ensure logging is enabled
    if (node instanceof lambda.Function) {
      if (!node.logRetention) {
        Annotations.of(node).addWarning("Lambda function should have log retention configured");
      }
    }
  }
}
