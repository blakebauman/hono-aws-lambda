import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export interface SecureLambdaProps extends NodejsFunctionProps {
  // Additional security props can be added here
}

export class SecureLambda extends NodejsFunction {
  constructor(scope: Construct, id: string, props: SecureLambdaProps) {
    super(scope, id, {
      ...props,
      // Security defaults
      tracing: lambda.Tracing.ACTIVE,
      logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      // Environment variables encryption handled by Lambda service
    });
  }
}
