import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config({ path: "../backend/.env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required to run Drizzle migrations.");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
