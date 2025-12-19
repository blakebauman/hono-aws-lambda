// Custom tools for agents
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { logger } from "../logger";

// Example: Search tool
const searchTool = new DynamicStructuredTool({
  name: "search",
  description: "Search for information on the web",
  schema: z.object({
    query: z.string().describe("The search query"),
  }),
  func: async ({ query }) => {
    logger.info("Search tool called", { query });
    // TODO: Implement actual search functionality
    return `Search results for: ${query}`;
  },
});

// Example: Calculator tool
const calculatorTool = new DynamicStructuredTool({
  name: "calculator",
  description: "Perform mathematical calculations",
  schema: z.object({
    expression: z.string().describe("Mathematical expression to evaluate"),
  }),
  func: async ({ expression }) => {
    try {
      // Safe evaluation (in production, use a proper math parser)
      const result = Function(`"use strict"; return (${expression})`)();
      logger.info("Calculator tool called", { expression, result });
      return String(result);
    } catch (error) {
      logger.error("Calculator error", error);
      return "Error: Invalid expression";
    }
  },
});

// Example: Database query tool
const dbQueryTool = new DynamicStructuredTool({
  name: "db_query",
  description: "Query the database",
  schema: z.object({
    query: z.string().describe("SQL query to execute"),
  }),
  func: async ({ query }) => {
    logger.info("Database query tool called", { query });
    // TODO: Implement safe database query execution
    // This should use parameterized queries and have proper access control
    return "Database query executed (placeholder)";
  },
});

export function createTools(toolNames?: string[]) {
  const allTools = {
    search: searchTool,
    calculator: calculatorTool,
    db_query: dbQueryTool,
  };

  if (!toolNames || toolNames.length === 0) {
    return Object.values(allTools);
  }

  const filtered = toolNames
    .map((name) => allTools[name as keyof typeof allTools])
    .filter((tool) => tool !== undefined);
  return filtered as Array<typeof searchTool | typeof calculatorTool | typeof dbQueryTool>;
}

export const availableTools = ["search", "calculator", "db_query"] as const;
