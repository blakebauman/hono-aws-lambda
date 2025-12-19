// LangGraph stateful workflows

import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { env } from "../env";
import { logger } from "../logger";
import { createCheckpointer } from "./checkpoints";
import { getLangSmithConfig } from "./langsmith";

// Define the state annotation for the graph using LangGraph v1.0 API
const GraphStateAnnotation = Annotation.Root({
  messages: Annotation<Array<{ role: string; content: string }>>,
  input: Annotation<string>,
  output: Annotation<string | undefined>,
  step: Annotation<number>,
});

// Define the state interface for the graph
export interface GraphState {
  messages: Array<{ role: string; content: string }>;
  input: string;
  output?: string;
  step: number;
}

// Example workflow: Simple chat with state management
export function createGraph() {
  try {
    const langsmithConfig = getLangSmithConfig();

    const model = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.7,
      apiKey: env.LANGCHAIN_API_KEY,
      configuration: langsmithConfig
        ? {
            defaultHeaders: {
              "x-langsmith-project": langsmithConfig.projectName,
            },
          }
        : undefined,
    });

    // Define nodes
    const processNode = async (state: GraphState): Promise<Partial<GraphState>> => {
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", "You are a helpful AI assistant."],
        ["human", "{input}"],
      ]);

      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      const output = await chain.invoke({ input: state.input });

      return {
        output,
        step: state.step + 1,
        messages: [
          ...state.messages,
          { role: "user", content: state.input },
          { role: "assistant", content: output },
        ],
      };
    };

    const validateNode = async (state: GraphState): Promise<Partial<GraphState>> => {
      // Simple validation - check if output exists
      if (!state.output) {
        return { step: state.step + 1 };
      }
      return {};
    };

    // Build the graph using LangGraph v1.0 API
    const workflow = new StateGraph(GraphStateAnnotation)
      .addNode("process", processNode)
      .addNode("validate", validateNode)
      .addEdge(START, "process")
      .addEdge("process", "validate")
      .addEdge("validate", END);

    // Add checkpointing if available
    const checkpointer = createCheckpointer();
    if (checkpointer) {
      // Note: LangGraph checkpointing would be configured here
      // This is a placeholder for the checkpoint configuration
      logger.info("Checkpointing available for graph");
    }

    const app = workflow.compile();

    logger.info("LangGraph workflow created");
    return app;
  } catch (error) {
    logger.error("Failed to create LangGraph", error);
    throw error;
  }
}

export async function invokeGraph(
  graph: ReturnType<typeof createGraph>,
  input: string,
  threadId?: string
): Promise<GraphState> {
  try {
    const initialState: GraphState = {
      messages: [],
      input,
      step: 0,
    };

    const config = threadId ? { configurable: { thread_id: threadId } } : {};
    const result = await graph.invoke(initialState, config);

    // Convert result to GraphState format
    // LangGraph returns state with the annotation structure
    const state = result as unknown as GraphState;
    return {
      messages: state.messages || [],
      input: state.input || input,
      output: state.output,
      step: state.step || 0,
    };
  } catch (error) {
    logger.error("Failed to invoke graph", error);
    throw error;
  }
}

export async function streamGraph(
  graph: ReturnType<typeof createGraph>,
  input: string,
  threadId?: string
): Promise<AsyncIterable<GraphState>> {
  try {
    const initialState: GraphState = {
      messages: [],
      input,
      step: 0,
    };

    const config = threadId ? { configurable: { thread_id: threadId } } : {};
    const stream = await graph.stream(initialState, config);

    // Transform stream to GraphState format
    return (async function* () {
      let currentState = { ...initialState };
      for await (const chunk of stream) {
        // LangGraph streams return partial state updates by node name
        // We need to merge them with the current state
        if (typeof chunk === "object" && chunk !== null) {
          // Handle node-specific updates
          const updates = Object.values(chunk)[0] as Partial<GraphState> | undefined;
          if (updates) {
            currentState = {
              ...currentState,
              ...updates,
            };
          }
        }
        yield currentState;
      }
    })();
  } catch (error) {
    logger.error("Failed to stream graph", error);
    throw error;
  }
}
