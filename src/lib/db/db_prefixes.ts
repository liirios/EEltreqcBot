import { and, eq } from "drizzle-orm";
import { DBPrefix, NewDBPrefix, PREFIXES } from "./db_schema";
import { DBBase } from "./db_classes";
import { db } from "./db";
import { PREFIX } from "../config";
import { Scope } from "./db_enum";

export class DBPrefixes extends DBBase<typeof PREFIXES, DBPrefix, DBPrefix, Record<string, Record<string, DBPrefix>>> {
	public globalPrefix: string = PREFIX;

	protected override load(table: typeof PREFIXES) {
		return db.select().from(table).all();
	}

	protected override store(row: DBPrefix) {
		if (row.scope === Scope.GLOBAL) this.globalPrefix = row.value ?? PREFIX;
		return (this.cache[row.scope] ??= {})[row.scope_id] = row;
	}

	protected override upsert(row: NewDBPrefix) {
		const table = this.ready;
		return db.insert(table).values(row).onConflictDoUpdate({target: [table.scope, table.scope_id], set: {value: row.value}}).returning().get();
	}

	public override sync(source: DBPrefix[] | null = null, clear: boolean = true) {
		if (clear) this.globalPrefix = PREFIX;
		return super.sync(source, clear);
	}

	public find(scope: Scope, scope_id: string): DBPrefix | undefined {
		return this.cache[scope]?.[scope_id];
	}

	public override get(scope: Scope = Scope.GLOBAL, scope_id: string = ""): string | null {
		if (scope === Scope.GLOBAL) return this.globalPrefix;
		const row = this.find(scope, scope_id);
		return row ? row.value : this.globalPrefix;
	}

	public set(value: string | null, scope: Scope = Scope.GLOBAL, scope_id: string = "", updateDB: boolean = true) {
		const row: DBPrefix = {scope, scope_id: scope === Scope.GLOBAL ? "" : scope_id, value};
		this.store(updateDB ? this.upsert(row) : row);
	}

	public delete(scope: Scope, scope_id: string) {
		if (scope === Scope.GLOBAL) return;
		const table = this.ready;
		db.delete(table).where(and(eq(table.scope, scope), eq(table.scope_id, scope_id))).run();
		delete this.cache[scope]?.[scope_id];
	}
}