import { IAspect, Tags } from "aws-cdk-lib";
import { IConstruct } from "constructs";

export class TaggingAspect implements IAspect {
  constructor(private readonly tags: Record<string, string>) {}

  visit(node: IConstruct): void {
    Tags.of(node).add("Project", this.tags.Project);
    Tags.of(node).add("Environment", this.tags.Environment);
    if (this.tags.CostCenter) {
      Tags.of(node).add("CostCenter", this.tags.CostCenter);
    }
  }
}
