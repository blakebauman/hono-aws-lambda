import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import type { AppConfig } from "../lib/config";

export interface CiCdStackProps extends cdk.StackProps {
  config: AppConfig;
}

export class CiCdStack extends cdk.Stack {
  public readonly githubOidcProvider: iam.OpenIdConnectProvider;
  public readonly githubActionsRole: iam.Role;

  constructor(scope: Construct, id: string, props: CiCdStackProps) {
    super(scope, id, props);

    // GitHub OIDC Provider
    this.githubOidcProvider = new iam.OpenIdConnectProvider(this, "GitHubOidcProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
      thumbprints: [
        "6938fd4d98bab03faadb97b34396831e3780aea1",
        "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
      ],
    });

    // IAM Role for GitHub Actions
    this.githubActionsRole = new iam.Role(this, "GitHubActionsRole", {
      assumedBy: new iam.WebIdentityPrincipal(this.githubOidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        },
        StringLike: {
          "token.actions.githubusercontent.com:sub": `repo:${process.env.GITHUB_REPO || "*/*"}:*`,
        },
      }),
      description: "Role for GitHub Actions to deploy CDK stacks",
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // Grant permissions to deploy CDK stacks
    this.githubActionsRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "cloudformation:*",
          "s3:*",
          "iam:*",
          "lambda:*",
          "apigateway:*",
          "rds:*",
          "elasticache:*",
          "ec2:*",
          "logs:*",
          "cloudwatch:*",
          "xray:*",
          "secretsmanager:*",
          "ssm:*",
        ],
        resources: ["*"],
      })
    );

    // Store role ARN in SSM Parameter Store
    new ssm.StringParameter(this, "GitHubActionsRoleArn", {
      parameterName: `/${props.config.projectName}/${props.config.env}/github-actions-role-arn`,
      stringValue: this.githubActionsRole.roleArn,
      description: "ARN of the IAM role for GitHub Actions",
    });

    // Outputs
    new cdk.CfnOutput(this, "GitHubActionsRoleArn", {
      value: this.githubActionsRole.roleArn,
      exportName: `${props.config.projectName}-github-actions-role-${props.config.env}`,
    });
  }
}
