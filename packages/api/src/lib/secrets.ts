import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { env } from "./env";
import { logger } from "./logger";

const client = new SecretsManagerClient({
  region: env.AWS_REGION,
});

interface SecretCache {
  [key: string]: {
    value: string;
    timestamp: number;
  };
}

const cache: SecretCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getSecret(secretName: string, useCache = true): Promise<string> {
  // Check cache first
  if (useCache && cache[secretName]) {
    const cached = cache[secretName];
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response = await client.send(command);
    const secretValue = response.SecretString || "";

    // Cache the value
    if (useCache) {
      cache[secretName] = {
        value: secretValue,
        timestamp: Date.now(),
      };
    }

    return secretValue;
  } catch (error) {
    logger.error("Failed to retrieve secret", error, { secretName });
    throw error;
  }
}

export async function getSecretJson<T = Record<string, unknown>>(
  secretName: string,
  useCache = true
): Promise<T> {
  const secretValue = await getSecret(secretName, useCache);
  return JSON.parse(secretValue) as T;
}
