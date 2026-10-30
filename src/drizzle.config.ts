import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/lib/db/db_schema.ts",
	out: "./drizzle",
	dbCredentials: { url: "./db/db.db" },
});