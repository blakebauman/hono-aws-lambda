import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { createChain, invokeChain, streamChain } from "../../lib/ai/chains";
import { setupLangSmithTracing } from "../../lib/ai/langsmith";
import { createMemory, getMemory } from "../../lib/ai/memory";

const chatRouter = new OpenAPIHono();

const chatRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  conversationId: z.string().optional(),
});

const chatResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    response: z.string(),
    conversationId: z.string(),
  }),
});

const chatRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Chat completion",
  description: "Send a chat message and get a response",
  tags: ["AI"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: chatRequestSchema as any,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Chat response",
      content: {
        "application/json": {
          schema: chatResponseSchema as any,
        },
      },
    },
  },
});

// @ts-expect-error - Zod v4 type compatibility issue with @hono/zod-openapi
chatRouter.openapi(chatRoute, async (c) => {
  const body = await c.req.json();
  const { message, conversationId } = chatRequestSchema.parse(body);

  try {
    // Setup LangSmith tracing
    setupLangSmithTracing();

    // Get or create conversation memory
    const convId = conversationId || globalThis.crypto.randomUUID();
    const _memory = getMemory(convId) || createMemory(convId);

    // Create chain
    const chain = createChain();

    // Invoke chain with message
    const response = await invokeChain(chain, message);

    return c.json(
      {
        success: true,
        data: {
          response,
          conversationId: convId,
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
          response: "",
          conversationId: conversationId || "",
        },
        error: {
          message: error instanceof Error ? error.message : "Failed to process chat",
          code: "CHAT_ERROR",
        },
      },
      500
    );
  }
});

const chatStreamRoute = createRoute({
  method: "post",
  path: "/stream",
  summary: "Streaming chat",
  description: "Send a chat message and get a streaming response",
  tags: ["AI"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: chatRequestSchema as any,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Streaming chat response",
      content: {
        "text/event-stream": {
          schema: z.string() as any,
        },
      },
    },
  },
});

chatRouter.openapi(chatStreamRoute, async (c) => {
  const body = await c.req.json();
  const { message } = chatRequestSchema.parse(body);

  try {
    // Setup LangSmith tracing
    setupLangSmithTracing();

    // Create chain
    const chain = createChain();

    // Stream response
    const stream = await streamChain(chain, message);

    // Use Hono's streaming helper for Server-Sent Events
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (typeof chunk === "string") {
                controller.enqueue(new TextEncoder().encode(`data: ${chunk}\n\n`));
              } else if (
                chunk &&
                typeof chunk === "object" &&
                chunk !== null &&
                "content" in chunk
              ) {
                const content = (chunk as { content: unknown }).content;
                controller.enqueue(new TextEncoder().encode(`data: ${String(content)}\n\n`));
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
          message: error instanceof Error ? error.message : "Failed to stream chat",
          code: "STREAM_ERROR",
        },
      },
      500
    );
  }
});

export default chatRouter;
