import { and, eq } from "drizzle-orm";
import { DBColor, NewDBColor, COLORS } from "./db_schema";
import { DBBase } from "./db_classes";
import { db } from "./db";

type Data = Partial<Omit<NewDBColor, "hex" | "name">>;

export class DBColors extends DBBase<typeof COLORS, DBColor, DBColor, Record<string, Record<string, DBColor>>> {
	protected override load(table: typeof COLORS) {
		return db.select().from(table).all();
	}

	protected override store(row: DBColor) {
		return (this.cache[row.hex] ??= {})[row.name] = row;
	}

	protected override upsert(hex: string, name: string, data: Data) {
		const table = this.ready;
		const existing = this.get(hex, name);
		if (existing) {
			if (Object.keys(data).length === 0) return existing;
			return db.update(table).set(data).where(and(eq(table.hex, hex), eq(table.name, name))).returning().get();
		}
		return db.insert(table).values({hex, name, ...data} as NewDBColor).returning().get();
	}

	public override get(hex: string, name: string): DBColor | undefined {
		return this.cache[hex.toLowerCase()]?.[name];
	}

	public getAll(): DBColor[] {
		return Object.values(this.cache).flatMap((value) => Object.values(value));
	}

	public getByHex(hex: string): DBColor[] {
		return Object.values(this.cache[hex.toLowerCase()] ?? {});
	}

	public getByName(name: string, caseInsensitive = true): DBColor | undefined {
		const lower = name.toLowerCase();
		return this.getAll().find((value) => caseInsensitive ? value.name.toLowerCase() === lower : value.name === name);
	}

	public update(hex: string, name: string, data: Data = {}) {
		return this.store(this.upsert(hex.toLowerCase(), name, data));
	}

	public delete(hex: string, name: string) {
		const table = this.ready;
		hex = hex.toLowerCase();
		db.delete(table).where(and(eq(table.hex, hex), eq(table.name, name))).run();
		delete this.cache[hex]?.[name];
		if (this.cache[hex] && Object.keys(this.cache[hex]).length === 0) delete this.cache[hex];
	}

	public clear() {
		db.delete(this.ready).run();
		this.cache = {};
	}
}