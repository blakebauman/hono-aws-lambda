import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import type { AppConfig } from "../lib/config";
import type { DatabaseStack } from "./database-stack";
import type { CacheStack } from "./cache-stack";
import type { StorageStack } from "./storage-stack";

export interface ApiStackProps extends cdk.StackProps {
  config: AppConfig;
  vpc: ec2.Vpc;
  databaseStack: DatabaseStack;
  cacheStack: CacheStack;
  storageStack: StorageStack;
}

export class ApiStack extends cdk.Stack {
  public readonly function: lambda.Function;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    // Security group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, "LambdaSecurityGroup", {
      vpc,
      description: "Security group for Lambda function",
      allowAllOutbound: true,
    });

    // Allow Lambda to connect to RDS Proxy
    if (props.databaseStack.proxy) {
      props.databaseStack.proxy.connections.allowFrom(
        lambdaSecurityGroup,
        ec2.Port.tcp(5432),
        "Allow Lambda to connect to RDS Proxy"
      );
    }

    // Lambda function
    this.function = new NodejsFunction(this, "ApiFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
      entry: "../../api/src/index.ts",
      bundling: {
        minify: true,
        sourceMap: true,
        target: "es2022",
        externalModules: ["aws-sdk", "@aws-sdk/*"],
        nodeModules: ["better-auth", "drizzle-orm", "@postgres-js/postgres"],
      },
      environment: {
        NODE_ENV: props.config.env,
        AWS_REGION: props.config.region,
        // Database and Redis URLs will be retrieved from Secrets Manager at runtime
        // The Lambda will use the secrets manager to get connection strings
      },
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      reservedConcurrentExecutions: props.config.env === "production" ? 100 : 10,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      // Lambda Insights can be enabled if needed
    });

    // Grant Lambda access to RDS Proxy (IAM permissions)
    if (props.databaseStack.proxy) {
      props.databaseStack.proxy.grantConnect(this.function, "dbadmin");
    }

    // Grant Lambda access to Secrets Manager for database credentials
    if (props.databaseStack.dbSecret) {
      props.databaseStack.dbSecret.grantRead(this.function);
    }

    // Grant Lambda access to S3 for storage
    props.storageStack.bucket.grantReadWrite(this.function);

    // Allow Lambda to connect to ElastiCache Redis
    if (props.cacheStack.securityGroup) {
      props.cacheStack.securityGroup.connections.allowFrom(
        lambdaSecurityGroup,
        ec2.Port.tcp(6379),
        "Allow Lambda to connect to Redis"
      );
    }

    // Grant Lambda access to CloudWatch
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "cloudwatch:PutMetricData",
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
        ],
        resources: ["*"],
      })
    );

    // API Gateway
    this.api = new apigateway.RestApi(this, "Api", {
      restApiName: `${props.config.projectName}-api-${props.config.env}`,
      description: `API for ${props.config.projectName}`,
      deployOptions: {
        stageName: props.config.env,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit: props.config.env === "production" ? 5000 : 500,
        throttlingRateLimit: props.config.env === "production" ? 2000 : 200,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
        allowCredentials: true,
      },
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(this.function, {
      proxy: true,
    });

    // Add proxy resource
    this.api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    // Outputs
    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.api.url,
      exportName: `${props.config.projectName}-api-url-${props.config.env}`,
    });

    new cdk.CfnOutput(this, "FunctionArn", {
      value: this.function.functionArn,
      exportName: `${props.config.projectName}-function-arn-${props.config.env}`,
    });
  }
}
