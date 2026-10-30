import { and, eq } from "drizzle-orm";
import { DBStarboard, DBStarboardMessage, NewDBStarboard, NewDBStarboardMessage, STARBOARDS, STARBOARD_MESSAGES } from "./db_schema";
import { DBBase } from "./db_classes";
import { db } from "./db";

type StarboardData = Partial<Omit<NewDBStarboard, "guild" | "id">>;
type MessageData = Partial<Omit<NewDBStarboardMessage, "guild" | "emoji" | "message">>;

export class DBStarboards extends DBBase<typeof STARBOARDS, DBStarboard, DBStarboard, Record<string, Record<string, DBStarboard>>> {
	protected override load(table: typeof STARBOARDS) {
		return db.select().from(table).all();
	}

	protected override store(row: DBStarboard) {
		return (this.cache[row.guild] ??= {})[row.id] = row;
	}

	protected override upsert(guild: string, id: string, data: StarboardData) {
		const table = this.ready;
		const existing = this.get(guild, id);
		if (existing) {
			if (Object.keys(data).length === 0) return existing;
			return db.update(table).set(data).where(and(eq(table.guild, guild), eq(table.id, id))).returning().get();
		}
		return db.insert(table).values({guild, id, ...data} as NewDBStarboard).returning().get();
	}

	public override get(guild: string, id: string): DBStarboard | undefined {
		return this.cache[guild]?.[id];
	}

	public getForGuild(guild: string): DBStarboard[] {
		return Object.values(this.cache[guild] ?? {});
	}

	public getForChannel(channel: string): DBStarboard[] {
		const found: DBStarboard[] = [];
		for (const guild of Object.values(this.cache)) {
			for (const row of Object.values(guild)) {
				if (row.channel === channel) found.push(row);
			}
		}
		return found;
	}

	public getForEmoji(emoji: string): DBStarboard[] {
		const found: DBStarboard[] = [];
		for (const guild of Object.values(this.cache)) {
			const row = Object.values(guild).find((value) => value.emoji === emoji);
			if (row) found.push(row);
		}
		return found;
	}

	public getByEmoji(guild: string, emoji: string): DBStarboard | undefined {
		return this.getForGuild(guild).find((value) => value.emoji === emoji);
	}

	public freeId(guild: string): string {
		const used = this.cache[guild] ?? {};
		let i = 1;
		while (String(i) in used) i++;
		return String(i);
	}

	public create(guild: string, data: Omit<NewDBStarboard, "guild" | "id">) {
		return this.update(guild, this.freeId(guild), data);
	}

	public update(guild: string, id: string, data: StarboardData) {
		return this.store(this.upsert(guild, id, data));
	}

	public setEmoji(guild: string, id: string, to: string) {
		const table = this.ready;
		const row = db.update(table).set({emoji: to}).where(and(eq(table.guild, guild), eq(table.id, id))).returning().get();
		if (!row) return;
		return this.store(row);
	}

	public delete(guild: string, id: string) {
		const table = this.ready;
		db.delete(table).where(and(eq(table.guild, guild), eq(table.id, id))).run();
		delete this.cache[guild]?.[id];
	}
}

export class DBStarboardMessages extends DBBase<typeof STARBOARD_MESSAGES, DBStarboardMessage, DBStarboardMessage, Record<string, Record<string, Record<string, DBStarboardMessage>>>> {
	protected override load(table: typeof STARBOARD_MESSAGES) {
		return db.select().from(table).all();
	}

	protected override store(row: DBStarboardMessage) {
		return ((this.cache[row.guild] ??= {})[row.emoji] ??= {})[row.message] = row;
	}

	protected override upsert(guild: string, emoji: string, message: string, data: MessageData) {
		const table = this.ready;
		const existing = this.get(guild, emoji, message);
		if (existing) {
			if (Object.keys(data).length === 0) return existing;
			return db.update(table).set(data).where(and(eq(table.guild, guild), eq(table.emoji, emoji), eq(table.message, message))).returning().get();
		}
		return db.insert(table).values({guild, emoji, message, ...data} as NewDBStarboardMessage).returning().get();
	}

	public override get(guild: string, emoji: string, message: string): DBStarboardMessage | undefined {
		return this.cache[guild]?.[emoji]?.[message];
	}

	public getForMessage(guild: string, message: string): DBStarboardMessage[] {
		return Object.values(this.cache[guild] ?? {}).flatMap((value) => value[message] ?? []);
	}

	public getByPost(starboard_message: string): DBStarboardMessage | undefined {
		const table = this.ready;
		const row = db.select().from(table).where(eq(table.starboard_message, starboard_message)).get();
		return row && this.store(row);
	}

	public update(guild: string, emoji: string, message: string, data: MessageData) {
		return this.store(this.upsert(guild, emoji, message, data));
	}

	public rekey(guild: string, from: string, to: string) {
		const field = this.cache[guild]?.[from];
		if (!field) return;
		for (const row of Object.values(field)) row.emoji = to;
		this.cache[guild][to] = field;
		delete this.cache[guild][from];
	}

	public delete(guild: string, emoji: string, message: string) {
		const table = this.ready;
		db.delete(table).where(and(eq(table.guild, guild), eq(table.emoji, emoji), eq(table.message, message))).run();
		delete this.cache[guild]?.[emoji]?.[message];
	}

	public clear(guild: string, emoji: string) {
		const table = this.ready;
		db.delete(table).where(and(eq(table.guild, guild), eq(table.emoji, emoji))).run();
		delete this.cache[guild]?.[emoji];
	}
}