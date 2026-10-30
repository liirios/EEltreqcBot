import { and, eq } from "drizzle-orm";
import { DBUser, NewDBUser, USERS } from "./db_schema";
import { DBBase } from "./db_classes";
import { db } from "./db";
import { Scope } from "./db_enum";

export type NotNullDBUser = {[K in keyof DBUser]: NonNullable<DBUser[K]>};

type Data = Partial<Omit<NewDBUser, "scope" | "scope_id" | "id">>;

export class DBUsers extends DBBase<typeof USERS, DBUser, DBUser, Record<Scope, Record<string, Record<string, DBUser>>>> {
	public default(id: string = "", scope: Scope = Scope.GLOBAL, scope_id: string = ""): NotNullDBUser {
		return {
			scope,
			scope_id,
			id,
			perm: 1,
			title: "{name}",
			limited: false,
			quiet: false
		};
	}

	protected override load(table: typeof USERS) {
		return db.select().from(table).all();
	}

	protected override store(row: DBUser) {
		return ((this.cache[row.scope] ??= {})[row.scope_id] ??= {})[row.id] = row;
	}

	protected override upsert(id: string, scope: Scope, scope_id: string, data: Data) {
		const table = this.ready;
		return db.insert(table).values({scope, scope_id, id, ...data}).onConflictDoUpdate({target: [table.scope, table.scope_id, table.id], set: data}).returning().get();
	}

	public find(id: string, scope: Scope = Scope.GLOBAL, scope_id: string = ""): DBUser | undefined {
		return this.cache[scope]?.[scope_id]?.[id];
	}

	public override get(id: string, scope: Scope = Scope.GLOBAL, scope_id: string = ""): NotNullDBUser {
		const rows = [this.find(id, Scope.GLOBAL, ""), scope === Scope.GLOBAL ? undefined : this.find(id, scope, scope_id)];
		const set = Object.assign({}, ...rows.map((value) => Object.fromEntries(Object.entries(value ?? {}).filter(([_key, value]) => value != null))));
		return {...this.default(id, scope, scope_id), ...set, scope, scope_id, id};
	}

	public update(id: string, data: Data = {}, scope: Scope = Scope.GLOBAL, scope_id: string = "") {
		if (Object.keys(data).length === 0) return;
		this.store(this.upsert(id, scope, scope_id, data));
	}

	public delete(id: string, scope: Scope = Scope.GLOBAL, scope_id: string = "") {
		const table = this.ready;
		db.delete(table).where(and(eq(table.scope, scope), eq(table.scope_id, scope_id), eq(table.id, id))).run();
		delete this.cache[scope]?.[scope_id]?.[id];
	}
}