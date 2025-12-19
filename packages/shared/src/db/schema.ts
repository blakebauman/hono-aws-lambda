import { pgTable, text, timestamp, uuid, boolean, integer } from "drizzle-orm/pg-core";

// Example table - can be extended
export const exampleTable = pgTable("example", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Better Auth will add its own tables via migration
// This is just an example schema

export type Example = typeof exampleTable.$inferSelect;
export type NewExample = typeof exampleTable.$inferInsert;
