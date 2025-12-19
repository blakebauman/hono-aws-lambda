import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

const apiRouter = new OpenAPIHono();

// Health check endpoint with OpenAPI schema
const healthRoute = createRoute({
  method: "get",
  path: "/health",
  summary: "Health check",
  description: "Returns the health status of the API",
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            timestamp: z.string(),
          }) as any,
        },
      },
    },
  },
});

apiRouter.openapi(healthRoute, (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Example API endpoint with OpenAPI schema
const exampleRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const exampleResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    createdAt: z.string(),
  }),
});

const exampleRoute = createRoute({
  method: "post",
  path: "/example",
  summary: "Create example",
  description: "Creates a new example item",
  request: {
    body: {
      content: {
        "application/json": {
          schema: exampleRequestSchema as any,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Example created successfully",
      content: {
        "application/json": {
          schema: exampleResponseSchema as any,
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            error: z.object({
              message: z.string(),
              code: z.string(),
            }),
          }) as any,
        },
      },
    },
  },
});

apiRouter.openapi(exampleRoute, async (c) => {
  try {
    const body = await c.req.json();
    const data = exampleRequestSchema.parse(body);
    return c.json(
      {
        success: true,
        data: {
          ...data,
          id: globalThis.crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        },
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Validation error",
          code: "VALIDATION_ERROR",
        },
      },
      400
    );
  }
});

export default apiRouter;
