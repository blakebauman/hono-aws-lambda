import type { Context } from "hono";

export interface AppVariables {
  requestId?: string;
  user?: {
    id: string;
    email: string;
  } | null;
  session?: {
    id: string;
    userId: string;
  } | null;
}

export type AppContext = Context<{ Variables: AppVariables }>;
