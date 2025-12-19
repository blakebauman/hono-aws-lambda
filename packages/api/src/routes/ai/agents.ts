import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { createAgentExecutor, invokeAgent } from "../../lib/ai/agents";
import { setupLangSmithTracing } from "../../lib/ai/langsmith";

const agentsRouter = new OpenAPIHono();

const agentRequestSchema = z.object({
  task: z.string().min(1).max(10000),
  agentType: z.string().optional(),
});

const agentResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    result: z.string(),
    agentType: z.string(),
    taskId: z.string(),
  }),
});

const agentRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Execute agent",
  description: "Execute a task using a LangChain agent",
  tags: ["AI"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: agentRequestSchema as any,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Agent execution result",
      content: {
        "application/json": {
          schema: agentResponseSchema as any,
        },
      },
    },
  },
});

// @ts-expect-error - Zod v4 type compatibility issue with @hono/zod-openapi
agentsRouter.openapi(agentRoute, async (c) => {
  const body = await c.req.json();
  const { task, agentType } = agentRequestSchema.parse(body);

  try {
    // Setup LangSmith tracing
    setupLangSmithTracing();

    // Create agent with optional tools based on agent type
    const tools = agentType === "research" ? ["search", "db_query"] : undefined;
    const agent = await createAgentExecutor({
      tools,
      systemPrompt:
        agentType === "research"
          ? "You are a research assistant. Use tools to gather and analyze information."
          : undefined,
    });

    // Invoke agent
    const result = await invokeAgent(agent, task);

    return c.json(
      {
        success: true,
        data: {
          result,
          agentType: agentType || "default",
          taskId: globalThis.crypto.randomUUID(),
        },
      },
      200
    );
  } catch (error) {
    // Return error response that matches the schema
    return c.json(
      {
        success: false,
        data: {
          result: "",
          agentType: agentType || "default",
          taskId: "",
        },
        error: {
          message: error instanceof Error ? error.message : "Failed to execute agent",
          code: "AGENT_ERROR",
        },
      },
      500
    );
  }
});

export default agentsRouter;
