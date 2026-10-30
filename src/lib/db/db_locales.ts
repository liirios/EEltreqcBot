import { DBLocale, NewDBLocale, LOCALES } from "./db_schema";
import { DBBase } from "./db_classes";
import { db } from "./db";
import { Scope } from "./db_enum";

export class DBLocales extends DBBase<typeof LOCALES, DBLocale, DBLocale, Record<string, Record<string, Record<string, DBLocale>>>> {
	protected override load(table: typeof LOCALES) {
		return db.select().from(table).all();
	}

	protected override store(row: DBLocale) {
		return ((this.cache[row.scope] ??= {})[row.scope_id] ??= {})[row.key] = row;
	}

	protected override upsert(row: NewDBLocale) {
		const table = this.ready;
		return db.insert(table).values(row).onConflictDoUpdate({target: [table.scope, table.scope_id, table.key], set: {value: row.value}}).returning().get();
	}

	public find(key: string, scope: string, scope_id: string): DBLocale | undefined {
		return this.cache[scope]?.[scope_id]?.[key];
	}

	public override get<T>(key: string, scope: Scope = Scope.GLOBAL, scope_id: string = "", def?: T): string | T {
		return this.find(key, scope, scope_id)?.value ?? def ?? key;
	}

	public set(key: string, value: string, scope: Scope = Scope.GLOBAL, scope_id: string = "", updateDB: boolean = true) {
		if (updateDB) this.upsert({scope, scope_id, key, value});
		this.store({scope, scope_id, key, value});
	}
}