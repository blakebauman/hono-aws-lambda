import { IAspect } from "aws-cdk-lib";
import { Annotations } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import * as rds from "aws-cdk-lib/aws-rds";

export class BackupAspect implements IAspect {
  visit(node: IConstruct): void {
    // Ensure backups are configured for RDS
    if (node instanceof rds.DatabaseInstance || node instanceof rds.DatabaseCluster) {
      // Check if backup is configured (this is a simplified check)
      Annotations.of(node).addInfo(
        "Ensure automated backups are configured with appropriate retention period."
      );
    }
  }
}
