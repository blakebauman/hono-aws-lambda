export type Environment = "development" | "staging" | "production";

export interface AppConfig {
  env: Environment;
  account: string;
  region: string;
  projectName: string;
}

export function getConfig(env?: Environment): AppConfig {
  const environment = (env || (process.env.CDK_ENV as Environment) || "development") as Environment;
  const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || "123456789012";
  const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || "us-east-1";
  const projectName = "hono-aws-lambda";

  return {
    env: environment,
    account,
    region,
    projectName,
  };
}
