// Agent configurations

import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import { env } from "../env";
import { logger } from "../logger";
import { getLangSmithConfig } from "./langsmith";
import { createTools } from "./tools";

export interface AgentConfig {
  model?: string;
  temperature?: number;
  tools?: string[];
  systemPrompt?: string;
}

const SYSTEM_PROMPT = `You are a helpful AI assistant with access to tools.
Use the tools available to you to help answer questions and complete tasks.
Always be helpful, accurate, and concise.`;

export async function createAgentExecutor(config: AgentConfig = {}) {
  try {
    const langsmithConfig = getLangSmithConfig();

    const model = new ChatOpenAI({
      model: config.model || "gpt-4o-mini",
      temperature: config.temperature ?? 0.7,
      apiKey: env.LANGCHAIN_API_KEY,
      configuration: langsmithConfig
        ? {
            defaultHeaders: {
              "x-langsmith-project": langsmithConfig.projectName,
            },
          }
        : undefined,
    });

    const tools = createTools(config.tools);
    const _prompt = ChatPromptTemplate.fromMessages([
      ["system", config.systemPrompt || SYSTEM_PROMPT],
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    // LangChain v1.0 uses createAgent with a different API
    // createAgent returns a compiled graph that can be invoked
    const agent = createAgent({
      model,
      tools,
      systemPrompt: config.systemPrompt || SYSTEM_PROMPT,
    });

    logger.info("LangChain agent created", {
      model: config.model || "gpt-4o-mini",
      tools: tools.length,
    });

    return agent;
  } catch (error) {
    logger.error("Failed to create agent", error);
    throw error;
  }
}

export async function invokeAgent(
  agent: Awaited<ReturnType<typeof createAgentExecutor>>,
  input: string,
  options?: { signal?: AbortSignal }
): Promise<string> {
  try {
    // LangChain v1.0 agent is a compiled graph
    const result = await agent.invoke(
      { messages: [{ role: "user", content: input }] },
      { signal: options?.signal }
    );
    // Extract the response from the agent result
    // The result structure depends on the agent implementation
    if (typeof result === "string") {
      return result;
    }
    if (result && typeof result === "object") {
      // Try to extract output from various possible structures
      if ("output" in result) {
        return String(result.output);
      }
      if ("messages" in result && Array.isArray(result.messages)) {
        const lastMessage = result.messages[result.messages.length - 1];
        if (lastMessage && "content" in lastMessage) {
          return String(lastMessage.content);
        }
      }
    }
    return String(result);
  } catch (error) {
    logger.error("Failed to invoke agent", error);
    throw error;
  }
}
