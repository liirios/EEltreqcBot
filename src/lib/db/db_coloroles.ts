import { and, eq } from "drizzle-orm";
import { DBColorole, NewDBColorole, COLOROLES } from "./db_schema";
import { DBBase } from "./db_classes";
import { db } from "./db";

type Data = Partial<Omit<NewDBColorole, "guild" | "id">>;

export class DBColoroles extends DBBase<typeof COLOROLES, DBColorole, DBColorole, Record<string, Record<string, DBColorole>>> {
	protected override load(table: typeof COLOROLES) {
		return db.select().from(table).all();
	}

	protected override store(row: DBColorole) {
		return (this.cache[row.guild] ??= {})[row.id] = row;
	}

	protected override upsert(guild: string, id: string, data: Data) {
		const table = this.ready;
		const existing = this.get(guild, id);
		if (existing) {
			if (Object.keys(data).length === 0) return existing;
			return db.update(table).set(data).where(and(eq(table.guild, guild), eq(table.id, id))).returning().get();
		}
		return db.insert(table).values({guild, id, ...data} as NewDBColorole).returning().get();
	}

	public override get(guild: string, id: string): DBColorole | undefined {
		return this.cache[guild]?.[id];
	}

	public getForGuild(guild: string): DBColorole[] {
		return Object.values(this.cache[guild] ?? {});
	}

	public getByRole(guild: string, role: string): DBColorole | undefined {
		return this.getForGuild(guild).find((value) => value.role === role);
	}

	public getByName(guild: string, name: string, caseInsensitive = true): DBColorole | undefined {
		const rows = this.getForGuild(guild);
		const exact = rows.find((value) => value.name === name);
		if (exact || !caseInsensitive) return exact;
		const lower = name.toLowerCase();
		return rows.find((value) => value.name.toLowerCase() === lower);
	}

	public freeId(guild: string): string {
		const used = this.cache[guild] ?? {};
		let i = 1;
		while (String(i) in used) i++;
		return String(i);
	}

	public create(guild: string, data: Omit<NewDBColorole, "guild" | "id">) {
		return this.update(guild, this.freeId(guild), data);
	}

	public update(guild: string, id: string, data: Data) {
		return this.store(this.upsert(guild, id, data));
	}

	public delete(guild: string, id: string) {
		const table = this.ready;
		db.delete(table).where(and(eq(table.guild, guild), eq(table.id, id))).run();
		delete this.cache[guild]?.[id];
	}

	public clear(guild: string) {
		const table = this.ready;
		db.delete(table).where(eq(table.guild, guild)).run();
		delete this.cache[guild];
	}
}