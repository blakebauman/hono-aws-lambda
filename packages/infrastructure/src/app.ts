// Source map support for better error messages
// import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { ApiStack } from "./stacks/api-stack";
import { DatabaseStack } from "./stacks/database-stack";
import { CacheStack } from "./stacks/cache-stack";
import { StorageStack } from "./stacks/storage-stack";
import { CdnStack } from "./stacks/cdn-stack";
import { SecurityStack } from "./stacks/security-stack";
import { MonitoringStack } from "./stacks/monitoring-stack";
import { CiCdStack } from "./stacks/ci-cd-stack";
import { getConfig } from "./lib/config";

const app = new cdk.App();

const env = (app.node.tryGetContext("env") as string) || "development";
const config = getConfig(env as "development" | "staging" | "production");

// Create a shared VPC stack for all resources
const vpcStack = new cdk.Stack(app, `${config.projectName}-vpc-${config.env}`, {
  env: {
    account: config.account,
    region: config.region,
  },
  tags: {
    Environment: config.env,
    Project: config.projectName,
  },
});

const vpc = new ec2.Vpc(vpcStack, "AppVpc", {
  maxAzs: 2,
  natGateways: config.env === "production" ? 2 : 1,
  subnetConfiguration: [
    {
      cidrMask: 24,
      name: "public",
      subnetType: ec2.SubnetType.PUBLIC,
    },
    {
      cidrMask: 24,
      name: "private",
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    },
    {
      cidrMask: 28,
      name: "isolated",
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    },
  ],
});

// Database stack
const databaseStack = new DatabaseStack(app, `${config.projectName}-database-${config.env}`, {
  env: {
    account: config.account,
    region: config.region,
  },
  config,
  vpc,
  tags: {
    Environment: config.env,
    Project: config.projectName,
  },
});

// Cache stack
const cacheStack = new CacheStack(app, `${config.projectName}-cache-${config.env}`, {
  env: {
    account: config.account,
    region: config.region,
  },
  config,
  vpc,
  tags: {
    Environment: config.env,
    Project: config.projectName,
  },
});

// Storage stack
const storageStack = new StorageStack(app, `${config.projectName}-storage-${config.env}`, {
  env: {
    account: config.account,
    region: config.region,
  },
  config,
  tags: {
    Environment: config.env,
    Project: config.projectName,
  },
});

// API stack
const apiStack = new ApiStack(app, `${config.projectName}-api-${config.env}`, {
  env: {
    account: config.account,
    region: config.region,
  },
  config,
  vpc,
  databaseStack,
  cacheStack,
  storageStack,
  tags: {
    Environment: config.env,
    Project: config.projectName,
  },
});

// CDN stack
const cdnStack = new CdnStack(app, `${config.projectName}-cdn-${config.env}`, {
  env: {
    account: config.account,
    region: config.region,
  },
  config,
  apiStack,
  tags: {
    Environment: config.env,
    Project: config.projectName,
  },
});

// Security stack
const securityStack = new SecurityStack(app, `${config.projectName}-security-${config.env}`, {
  env: {
    account: config.account,
    region: config.region,
  },
  config,
  apiStack,
  tags: {
    Environment: config.env,
    Project: config.projectName,
  },
});

// Monitoring stack
const monitoringStack = new MonitoringStack(app, `${config.projectName}-monitoring-${config.env}`, {
  env: {
    account: config.account,
    region: config.region,
  },
  config,
  apiStack,
  tags: {
    Environment: config.env,
    Project: config.projectName,
  },
});

// CI/CD stack (only for production)
if (config.env === "production") {
  new CiCdStack(app, `${config.projectName}-cicd-${config.env}`, {
    env: {
      account: config.account,
      region: config.region,
    },
    config,
    tags: {
      Environment: config.env,
      Project: config.projectName,
    },
  });
}
