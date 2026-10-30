import { DBGuild, NewDBGuild, GUILDS } from "./db_schema";
import { NotNullDBBase } from "./db_classes";
import { db } from "./db";

export type NotNullDBGuild = {[K in keyof DBGuild]: NonNullable<DBGuild[K]>};

type Data = Partial<Omit<NewDBGuild, "id">>;

export class DBGuilds extends NotNullDBBase<typeof GUILDS, DBGuild, NewDBGuild> {
	public override default(id: string = ""): NotNullDBGuild {
		return {
			id,
			limited: false,
			quiet: false
		};
	}

	public override normalize(row: DBGuild): NotNullDBGuild {
		const def = this.default(row.id);
		return {
			id: row.id,
			limited: row.limited ?? def.limited,
			quiet: row.quiet ?? def.quiet
		};
	}

	protected override load(table: typeof GUILDS) {
		return db.select().from(table).all();
	}

	protected override upsert(id: string, data: Data) {
		const table = this.ready;
		return db.insert(table).values({...this.default(id), ...data}).onConflictDoUpdate({target: table.id, set: data}).returning().get();
	}
}