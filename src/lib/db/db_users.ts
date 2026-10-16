import { UserError } from "@sapphire/framework";
import { DBUser, USERS } from "./db_schema"
import { db } from "./db";

export class DBUsersInitError extends UserError {
    public constructor() {
        super({
            identifier: "DBUsersInitError",
            message: `DBUsers arent initialized properly`,
            context: {},
        });
    }
}

export type NotNullDBUser = {[K in keyof DBUser]: NonNullable<DBUser[K]>};

export class DBUsers {
    private users: Record<string, NotNullDBUser> = {};
    private table: typeof USERS | undefined;

    public constructor(table?: typeof USERS) {
        this.table = table;
    }

    public sync(source: Record<string, DBUser> | null = null, clear: boolean = true) {
        if (clear) this.users = {};
        if (source == null) {
            if (this.table == null) throw new DBUsersInitError();
            db.select().from(this.table).all().forEach((row) => this.users[row.id] = DBUsers.normalize(row));
        }
        else Object.entries(source).forEach(([id, user]) => this.users[id] = DBUsers.normalize(user));
        return this;
    }

    public static default(id: string): NotNullDBUser {
        return {
            id,
            perm: 1,
            title: "{name}",
            limited: false,
            quiet: false,
        }
    }

    public static normalize(row: DBUser): NotNullDBUser {
        const def = DBUsers.default(row.id);
        return {
            id: row.id,
            perm: row.perm ?? def.perm,
            title: row.title ?? def.title,
            limited: row.limited ?? def.limited,
            quiet: row.quiet ?? def.quiet,
        }
    }

    public get(id: string): DBUser | undefined {
        return this.users[id];
    }

    public getOrDefault(id: string): NotNullDBUser {
        const row = this.get(id);
        return row === undefined ? DBUsers.default(id) : DBUsers.normalize(row);
    }

    public update(id: string, data: Partial<Omit<DBUser, "id">> = {}) {
        if (this.table == null) throw new DBUsersInitError();
        if (Object.keys(data).length === 0) return;
        const row = db.insert(this.table).values({...DBUsers.default(id), ...data}).onConflictDoUpdate({target: this.table.id, set: data}).returning().get();
        this.users[id] = DBUsers.normalize(row);
    }
}