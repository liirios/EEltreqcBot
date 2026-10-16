import { UserError } from "@sapphire/framework";
import { DBGuild, GUILDS } from "./db_schema"
import { db } from "./db";

export class DBGuildsInitError extends UserError {
    public constructor() {
        super({
            identifier: "DBGuildsInitError",
            message: `DBGuilds arent initialized properly`,
            context: {},
        });
    }
}

export type NotNullDBGuild = {[K in keyof DBGuild]: NonNullable<DBGuild[K]>};

export class DBGuilds {
    private guilds: Record<string, NotNullDBGuild> = {};
    private table: typeof GUILDS | undefined;

    public constructor(table?: typeof GUILDS) {
        this.table = table;
    }

    public sync(source: Record<string, DBGuild> | null = null, clear: boolean = true) {
        if (clear) this.guilds = {};
        if (source == null) {
            if (this.table == null) throw new DBGuildsInitError();
            db.select().from(this.table).all().forEach((row) => this.guilds[row.id] = DBGuilds.normalize(row));
        }
        else Object.entries(source).forEach(([id, guild]) => this.guilds[id] = DBGuilds.normalize(guild));
        return this;
    }

    public static default(id: string = ""): NotNullDBGuild {
        return {
            id,
            limited: false,
            quiet: false,
            prefix: "^"
        }
    }

    public static normalize(row: DBGuild): NotNullDBGuild {
        const def = DBGuilds.default(row.id);
        return {
            id: row.id,
            limited: row.limited ?? def.limited,
            quiet: row.quiet ?? def.quiet,
            prefix: row.prefix ?? def.prefix
        }
    }

    public get(id: string): DBGuild | undefined {
        return this.guilds[id];
    }

    public getOrDefault(id: string): NotNullDBGuild {
        const row = this.get(id);
        return row === undefined ? DBGuilds.default(id) : DBGuilds.normalize(row);
    }

    public update(id: string, data: Partial<Omit<DBGuild, "id">> = {}) {
        if (this.table == null) throw new DBGuildsInitError();
        if (Object.keys(data).length === 0) return;
        const row = db.insert(this.table).values({...DBGuilds.default(id), ...data}).onConflictDoUpdate({target: this.table.id, set: data}).returning().get();
        this.guilds[id] = DBGuilds.normalize(row);
    }
}