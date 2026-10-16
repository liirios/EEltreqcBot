import { UserError } from "@sapphire/framework";
import { db, LOCALES, PER_GUILD_LOCALES } from "./db";

export class DBLocalesInitError extends UserError {
    public constructor() {
        super({
            identifier: "DBLocalesInitError",
            message: `DBLocaless arent initialized properly`,
            context: {},
        });
    }
}

export class DBLocales {
    private locales: Record<string, string> = {};
    private table: typeof LOCALES | undefined;

    public constructor(table?: typeof LOCALES) {
        this.table = table;
    }

    public sync(source: Record<string, string> | null = null, clear: boolean = true) {
        if (clear) this.locales = {};
        if (source == null) {
            if (this.table == null) throw new DBLocalesInitError();
            db.select().from(this.table).all().forEach((row) => this.set(row.key, row.value, false));
        }
        else Object.entries(source).forEach(([key, value]) => this.set(key, value, false));
        return this;
    }

    public find(key: string): string | undefined {
        return this.locales[key];
    }

    public get<T>(key: string, def?: T): string | T {
        return this.find(key) ?? def ?? key;
    }

    public set(key: string, value: string, updateDB: boolean = true) {
        if (updateDB) {
            if (this.table == null) throw new DBLocalesInitError();
            db.insert(this.table).values({key: key, value: value}).onConflictDoUpdate({target: this.table.key, set: {value}}).run();
        }
        this.locales[key] = value;
    }
}

export class PerGuildDBLocales {
    private locales: Record<string, Record<string, string>> = {};
    private table: typeof PER_GUILD_LOCALES | undefined;

    public constructor(table?: typeof PER_GUILD_LOCALES) {
        this.table = table;
    }

    public sync(source: Record<string, Record<string, string>> | null = null, clear: boolean = true) {
        if (clear) this.locales = {};
        if (source == null) {
            if (this.table == null) throw new DBLocalesInitError();
            db.select().from(this.table).all().forEach((row) => this.set(row.guild, row.key, row.value, false));
        }
        else Object.entries(source).forEach(([guild, rows]) => Object.entries(rows).forEach(([key, value]) => this.set(guild, key, value, false)));
        return this;
    }

    public find(guild: string, key: string): string | undefined {
        return this.locales[guild]?.[key];
    }

    public get<T>(guild: string, key: string, def?: T): string | T {
        return this.find(guild, key) ?? def ?? key;
    }

    public set(guild: string, key: string, value: string, updateDB: boolean = true) {
        if (updateDB) {
            if (this.table == null) throw new DBLocalesInitError();
            db.insert(this.table).values({guild: guild, key: key, value: value}).onConflictDoUpdate({target: [this.table.guild, this.table.key], set: {value}}).run();
        }
        if (this.locales[guild] === undefined) this.locales[guild] = {};
        this.locales[guild][key] = value;
    }
}