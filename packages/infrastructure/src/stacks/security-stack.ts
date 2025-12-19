import * as cdk from "aws-cdk-lib";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";
import type { AppConfig } from "../lib/config";
import type { ApiStack } from "./api-stack";

export interface SecurityStackProps extends cdk.StackProps {
  config: AppConfig;
  apiStack: ApiStack;
}

export class SecurityStack extends cdk.Stack {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // WAF Web ACL (only for production)
    if (props.config.env === "production") {
      this.webAcl = new wafv2.CfnWebACL(this, "WebAcl", {
        name: `${props.config.projectName}-waf-${props.config.env}`,
        scope: "REGIONAL",
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: "AWSManagedRulesCommonRuleSet",
            priority: 1,
            statement: {
              managedRuleGroupStatement: {
                vendorName: "AWS",
                name: "AWSManagedRulesCommonRuleSet",
              },
            },
            overrideAction: {
              none: {},
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: "CommonRuleSet",
            },
          },
          {
            name: "AWSManagedRulesKnownBadInputsRuleSet",
            priority: 2,
            statement: {
              managedRuleGroupStatement: {
                vendorName: "AWS",
                name: "AWSManagedRulesKnownBadInputsRuleSet",
              },
            },
            overrideAction: {
              none: {},
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: "KnownBadInputs",
            },
          },
          {
            name: "RateLimitRule",
            priority: 3,
            statement: {
              rateBasedStatement: {
                limit: props.config.env === "production" ? 2000 : 500,
                aggregateKeyType: "IP",
              },
            },
            action: {
              block: {},
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: "RateLimit",
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: "WebAcl",
        },
      });

      // Associate WAF with API Gateway
      new wafv2.CfnWebACLAssociation(this, "WebAclAssociation", {
        resourceArn: props.apiStack.api.deploymentStage.stageArn,
        webAclArn: this.webAcl.attrArn,
      });
    }
  }
}
