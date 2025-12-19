import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";
import type { AppConfig } from "../lib/config";
import type { ApiStack } from "./api-stack";

export interface CdnStackProps extends cdk.StackProps {
  config: AppConfig;
  apiStack: ApiStack;
}

export class CdnStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CdnStackProps) {
    super(scope, id, props);

    // CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.RestApiOrigin(props.apiStack.api),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // API responses shouldn't be cached by default
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        compress: true,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      comment: `CDN for ${props.config.projectName} API`,
      defaultRootObject: "",
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    // Outputs
    new cdk.CfnOutput(this, "DistributionId", {
      value: this.distribution.distributionId,
      exportName: `${props.config.projectName}-cdn-id-${props.config.env}`,
    });

    new cdk.CfnOutput(this, "DistributionUrl", {
      value: `https://${this.distribution.distributionDomainName}`,
      exportName: `${props.config.projectName}-cdn-url-${props.config.env}`,
    });
  }
}
