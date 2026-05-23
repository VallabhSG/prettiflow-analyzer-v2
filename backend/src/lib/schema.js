import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Example schema - agent will modify this based on requirements
export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow(),
});
