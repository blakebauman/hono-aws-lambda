import { IAspect } from "aws-cdk-lib";
import { Annotations } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as rds from "aws-cdk-lib/aws-rds";

export class CostOptimizationAspect implements IAspect {
  visit(node: IConstruct): void {
    // Check Lambda memory allocation
    if (node instanceof lambda.Function) {
      const memorySize = node.memorySize;
      if (memorySize && memorySize > 3008) {
        Annotations.of(node).addInfo(
          `Lambda function has ${memorySize}MB memory. Consider right-sizing for cost optimization.`
        );
      }
    }

    // Check RDS instance size
    if (node instanceof rds.DatabaseInstance) {
      Annotations.of(node).addInfo(
        "Consider using Aurora Serverless v2 for better cost optimization and auto-scaling."
      );
    }
  }
}
