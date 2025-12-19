import { apiReference } from "@scalar/hono-api-reference";
import { Hono } from "hono";

const docsRouter = new Hono();

// Scalar API Reference documentation
// Automatically loads OpenAPI spec from /api/openapi.json
docsRouter.get(
  "/",
  apiReference({
    theme: "purple",
    layout: "modern",
    defaultHttpClient: {
      targetKey: "js",
      clientKey: "fetch",
    },
  })
);

export default docsRouter;
