import { UserError } from "@sapphire/framework";
import { DBChannel, CHANNELS } from "./db_schema"
import { db } from "./db";

export class DBChannelsInitError extends UserError {
    public constructor() {
        super({
            identifier: "DBChannelsInitError",
            message: `DBChannels arent initialized properly`,
            context: {},
        });
    }
}

export type NotNullDBChannel = {[K in keyof DBChannel]: NonNullable<DBChannel[K]>};

export class DBChannels {
    private guilds: Record<string, NotNullDBChannel> = {};
    private table: typeof CHANNELS | undefined;

    public constructor(table?: typeof CHANNELS) {
        this.table = table;
    }

    public sync(source: Record<string, DBChannel> | null = null, clear: boolean = true) {
        if (clear) this.guilds = {};
        if (source == null) {
            if (this.table == null) throw new DBChannelsInitError();
            db.select().from(this.table).all().forEach((row) => this.guilds[row.id] = DBChannels.normalize(row));
        }
        else Object.entries(source).forEach(([id, guild]) => this.guilds[id] = DBChannels.normalize(guild));
        return this;
    }

    public static default(id: string = ""): NotNullDBChannel {
        return {
            id,
            limited: false,
            quiet: false,
            prefix: "^"
        }
    }

    public static normalize(row: DBChannel): NotNullDBChannel {
        const def = DBChannels.default(row.id);
        return {
            id: row.id,
            limited: row.limited ?? def.limited,
            quiet: row.quiet ?? def.quiet,
            prefix: row.prefix ?? def.prefix
        }
    }

    public get(id: string): DBChannel | undefined {
        return this.guilds[id];
    }

    public getOrDefault(id: string): NotNullDBChannel {
        const row = this.get(id);
        return row === undefined ? DBChannels.default(id) : DBChannels.normalize(row);
    }

    public update(id: string, data: Partial<Omit<DBChannel, "id">> = {}) {
        if (this.table == null) throw new DBChannelsInitError();
        if (Object.keys(data).length === 0) return;
        const row = db.insert(this.table).values({...DBChannels.default(id), ...data}).onConflictDoUpdate({target: this.table.id, set: data}).returning().get();
        this.guilds[id] = DBChannels.normalize(row);
    }
}