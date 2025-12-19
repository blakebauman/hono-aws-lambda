// LangChain chains setup

import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { env } from "../env";
import { logger } from "../logger";
import { getLangSmithConfig } from "./langsmith";

export interface ChainConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export function createChain(config: ChainConfig = {}) {
  try {
    const langsmithConfig = getLangSmithConfig();

    const model = new ChatOpenAI({
      model: config.model || "gpt-4o-mini",
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens,
      apiKey: env.LANGCHAIN_API_KEY,
      configuration: langsmithConfig
        ? {
            defaultHeaders: {
              "x-langsmith-project": langsmithConfig.projectName,
            },
          }
        : undefined,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful AI assistant."],
      ["human", "{input}"],
    ]);

    const chain = RunnableSequence.from([prompt, model, new StringOutputParser()]);

    logger.info("LangChain chain created", { model: config.model || "gpt-4o-mini" });
    return chain;
  } catch (error) {
    logger.error("Failed to create LangChain chain", error);
    throw error;
  }
}

export async function invokeChain(
  chain: RunnableSequence<{ input: string }, string>,
  input: string
): Promise<string> {
  try {
    const result = await chain.invoke({ input });
    return result;
  } catch (error) {
    logger.error("Failed to invoke chain", error);
    throw error;
  }
}

export async function streamChain(
  chain: RunnableSequence<{ input: string }, string>,
  input: string
): Promise<AsyncIterable<string>> {
  try {
    const stream = await chain.stream({ input });
    return stream;
  } catch (error) {
    logger.error("Failed to stream chain", error);
    throw error;
  }
}
