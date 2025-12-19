import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import app from "./app";
import { setupLangSmithTracing } from "./lib/ai/langsmith";

// Setup LangSmith tracing on Lambda cold start
setupLangSmithTracing();

// Lambda handler for AWS Lambda
export const handler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const queryString = event.queryStringParameters
    ? new URLSearchParams(event.queryStringParameters as Record<string, string>).toString()
    : "";
  const path = `${event.path}${queryString ? `?${queryString}` : ""}`;
  const method = event.httpMethod || "GET";
  const domainName = event.requestContext.domainName || "localhost";

  const request = new Request(`https://${domainName}${path}`, {
    method,
    headers: new Headers(event.headers as HeadersInit),
    body: event.body ? (event.isBase64Encoded ? atob(event.body) : event.body) : undefined,
  });

  const response = await app.fetch(request, {
    waitUntil: async () => {
      // Lambda doesn't support waitUntil
    },
    passThroughOnException: () => {
      // Pass through on exception
    },
  });

  const responseBody = await response.text();
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    statusCode: response.status,
    headers,
    body: responseBody,
    isBase64Encoded: false,
  };
};
