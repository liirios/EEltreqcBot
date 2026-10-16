import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "sqlite",
    schema: "./src/lib/db/db.ts",
    out: "./drizzle",
    dbCredentials: { url: "./db/db.db" },
});