import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatch_actions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as sns from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import type { AppConfig } from "../lib/config";
import type { ApiStack } from "./api-stack";

export interface MonitoringStackProps extends cdk.StackProps {
  config: AppConfig;
  apiStack: ApiStack;
}

export class MonitoringStack extends cdk.Stack {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, "AlarmTopic", {
      topicName: `${props.config.projectName}-alarms-${props.config.env}`,
      displayName: `${props.config.projectName} Alarms`,
    });

    // CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, "Dashboard", {
      dashboardName: `${props.config.projectName}-${props.config.env}`,
    });

    // Lambda metrics
    const lambdaErrors = props.apiStack.function.metricErrors({
      period: cdk.Duration.minutes(5),
      statistic: "Sum",
    });

    const lambdaDuration = props.apiStack.function.metricDuration({
      period: cdk.Duration.minutes(5),
      statistic: "Average",
    });

    const lambdaInvocations = props.apiStack.function.metricInvocations({
      period: cdk.Duration.minutes(5),
      statistic: "Sum",
    });

    // API Gateway metrics
    const api4xxErrors = props.apiStack.api.metricClientError({
      period: cdk.Duration.minutes(5),
      statistic: "Sum",
    });

    const api5xxErrors = props.apiStack.api.metricServerError({
      period: cdk.Duration.minutes(5),
      statistic: "Sum",
    });

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Lambda Errors",
        left: [lambdaErrors],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: "Lambda Duration",
        left: [lambdaDuration],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: "Lambda Invocations",
        left: [lambdaInvocations],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: "API 4xx Errors",
        left: [api4xxErrors],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: "API 5xx Errors",
        left: [api5xxErrors],
        width: 12,
      })
    );

    // Alarms
    const errorAlarm = lambdaErrors.createAlarm(this, "LambdaErrorAlarm", {
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: "Lambda function has too many errors",
    });

    const durationAlarm = lambdaDuration.createAlarm(this, "LambdaDurationAlarm", {
      threshold: 5000, // 5 seconds
      evaluationPeriods: 2,
      alarmDescription: "Lambda function is taking too long",
    });

    const api5xxAlarm = api5xxErrors.createAlarm(this, "Api5xxAlarm", {
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: "API has too many 5xx errors",
    });

    // Add SNS action to alarms
    const snsAction = new cloudwatch_actions.SnsAction(this.alarmTopic);
    errorAlarm.addAlarmAction(snsAction);
    durationAlarm.addAlarmAction(snsAction);
    api5xxAlarm.addAlarmAction(snsAction);
  }
}
