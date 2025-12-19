import { Hono } from "hono";
import { auth } from "../lib/auth";

const authRouter = new Hono();

// Mount Better Auth handler
authRouter.on(["GET", "POST"], "/*", async (c) => {
  return auth.handler(c.req.raw);
});

export default authRouter;
