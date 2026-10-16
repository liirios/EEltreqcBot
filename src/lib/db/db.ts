import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

const sqlite = new Database("./db/db.db");
sqlite.pragma("journal_mode = WAL");

export const db: BetterSQLite3Database = drizzle(sqlite);

export * from "./db_schema";