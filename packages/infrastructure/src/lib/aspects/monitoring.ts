import { IAspect } from "aws-cdk-lib";
import { Annotations } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";

export class MonitoringAspect implements IAspect {
  visit(node: IConstruct): void {
    // Ensure X-Ray tracing is enabled for Lambda
    if (node instanceof lambda.Function) {
      if (node.tracing !== lambda.Tracing.ACTIVE) {
        Annotations.of(node).addInfo("Consider enabling X-Ray tracing for better observability");
      }
    }
  }
}
