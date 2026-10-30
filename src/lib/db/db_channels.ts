import { DBChannel, NewDBChannel, CHANNELS } from "./db_schema";
import { NotNullDBBase } from "./db_classes";
import { db } from "./db";

export type NotNullDBChannel = {[K in keyof DBChannel]: NonNullable<DBChannel[K]>};

type Data = Partial<Omit<NewDBChannel, "id">>;

export class DBChannels extends NotNullDBBase<typeof CHANNELS, DBChannel, NewDBChannel> {
	public override default(id: string = ""): NotNullDBChannel {
		return {
			id,
			limited: false,
			quiet: false
		};
	}

	public override normalize(row: DBChannel): NotNullDBChannel {
		const def = this.default(row.id);
		return {
			id: row.id,
			limited: row.limited ?? def.limited,
			quiet: row.quiet ?? def.quiet
		};
	}

	protected override load(table: typeof CHANNELS) {
		return db.select().from(table).all();
	}

	protected override upsert(id: string, data: Data) {
		const table = this.ready;
		return db.insert(table).values({...this.default(id), ...data}).onConflictDoUpdate({target: table.id, set: data}).returning().get();
	}
}