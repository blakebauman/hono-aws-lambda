import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { createGraph, invokeGraph, streamGraph } from "../../lib/ai/graphs";
import { setupLangSmithTracing } from "../../lib/ai/langsmith";

const graphsRouter = new OpenAPIHono();

const graphRequestSchema = z.object({
  input: z.union([z.string(), z.record(z.string(), z.unknown())]),
  graphId: z.string().optional(),
});

const graphResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    result: z.string(),
    graphId: z.string(),
    state: z.record(z.string(), z.unknown()),
  }),
});

const graphStateResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    graphId: z.string(),
    state: z.record(z.string(), z.unknown()),
  }),
});

const graphRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Execute LangGraph workflow",
  description: "Execute a stateful LangGraph workflow",
  tags: ["AI"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: graphRequestSchema as any,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Graph execution result",
      content: {
        "application/json": {
          schema: graphResponseSchema as any,
        },
      },
    },
  },
});

// @ts-expect-error - Zod v4 type compatibility issue with @hono/zod-openapi
graphsRouter.openapi(graphRoute, async (c) => {
  const body = await c.req.json();
  const { input, graphId } = graphRequestSchema.parse(body);

  try {
    // Setup LangSmith tracing
    setupLangSmithTracing();

    // Create graph
    const graph = createGraph();

    // Extract input string from the input object
    const inputString = typeof input === "string" ? input : JSON.stringify(input);
    const threadId = graphId;

    // Invoke graph
    const result = await invokeGraph(graph, inputString, threadId);

    return c.json({
      success: true,
      data: {
        result: result.output || "Graph execution completed",
        graphId: threadId || globalThis.crypto.randomUUID(),
        state: {
          messages: result.messages,
          step: result.step,
        },
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Failed to execute graph",
          code: "GRAPH_ERROR",
        },
      },
      500
    );
  }
});

const getGraphStateRoute = createRoute({
  method: "get",
  path: "/{graphId}/state",
  summary: "Get graph state",
  description: "Retrieve the current state of a LangGraph workflow",
  tags: ["AI"],
  request: {
    params: z.object({
      graphId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Graph state",
      content: {
        "application/json": {
          schema: graphStateResponseSchema as any,
        },
      },
    },
  },
});

// @ts-expect-error - Zod v4 type compatibility issue with @hono/zod-openapi
graphsRouter.openapi(getGraphStateRoute, async (c) => {
  const graphId = c.req.param("graphId");

  try {
    // In a production implementation, you would retrieve the state from the checkpointer
    // For now, we return a placeholder structure
    // TODO: Implement state retrieval from checkpoint storage

    return c.json({
      success: true,
      data: {
        graphId,
        state: {
          // State would be retrieved from checkpoint storage
          message: "State retrieval from checkpoint storage not yet implemented",
        },
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Failed to retrieve graph state",
          code: "STATE_ERROR",
        },
      },
      500
    );
  }
});

const graphStreamRoute = createRoute({
  method: "post",
  path: "/{graphId}/stream",
  summary: "Stream graph execution",
  description: "Execute a LangGraph workflow with streaming output",
  tags: ["AI"],
  request: {
    params: z.object({
      graphId: z.string(),
    }) as any,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            input: z.union([z.string(), z.record(z.string(), z.unknown())]),
          }) as any,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Streaming graph execution",
      content: {
        "text/event-stream": {
          schema: z.string() as any,
        },
      },
    },
  },
});

graphsRouter.openapi(graphStreamRoute, async (c) => {
  const graphId = c.req.param("graphId");
  const body = await c.req.json();
  const { input } = z
    .object({
      input: z.union([z.string(), z.record(z.string(), z.unknown())]),
    })
    .parse(body);

  try {
    // Setup LangSmith tracing
    setupLangSmithTracing();

    // Create graph
    const graph = createGraph();

    // Extract input string from the input object
    const inputString = typeof input === "string" ? input : JSON.stringify(input);

    // Stream graph execution using ReadableStream
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            const graphStream = await streamGraph(graph, inputString, graphId);

            for await (const state of graphStream) {
              if (state.output) {
                controller.enqueue(new TextEncoder().encode(`data: ${state.output}\n\n`));
              }
            }
            controller.close();
          } catch (error) {
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({
                  error: error instanceof Error ? error.message : "Stream error",
                })}\n\n`
              )
            );
            controller.close();
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Failed to stream graph",
          code: "STREAM_ERROR",
        },
      },
      500
    );
  }
});

export default graphsRouter;
