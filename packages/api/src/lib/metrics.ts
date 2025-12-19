import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { env } from "./env";
import { logger } from "./logger";

const client = new CloudWatchClient({
  region: env.AWS_REGION,
});

interface MetricData {
  MetricName: string;
  Value: number;
  Unit?: string;
  Dimensions?: Array<{ Name: string; Value: string }>;
  Timestamp?: Date;
}

export async function putMetric(namespace: string, metrics: MetricData[]): Promise<void> {
  try {
    const command = new PutMetricDataCommand({
      Namespace: namespace,
      MetricData: metrics.map((metric) => ({
        MetricName: metric.MetricName,
        Value: metric.Value,
        Unit: (metric.Unit || "Count") as "Count" | "Milliseconds" | "Bytes" | "Percent" | "None",
        Dimensions: metric.Dimensions,
        Timestamp: metric.Timestamp || new Date(),
      })),
    });

    await client.send(command);
  } catch (error) {
    logger.error("Failed to put metric", error, { namespace, metrics });
  }
}

export function trackLatency(
  metricName: string,
  latencyMs: number,
  dimensions?: Record<string, string>
) {
  return putMetric("API", [
    {
      MetricName: metricName,
      Value: latencyMs,
      Unit: "Milliseconds",
      Dimensions: dimensions
        ? Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value }))
        : undefined,
    },
  ]);
}

export function trackCount(metricName: string, count = 1, dimensions?: Record<string, string>) {
  return putMetric("API", [
    {
      MetricName: metricName,
      Value: count,
      Unit: "Count",
      Dimensions: dimensions
        ? Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value }))
        : undefined,
    },
  ]);
}
