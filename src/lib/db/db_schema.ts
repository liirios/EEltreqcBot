import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const USERS = sqliteTable("users", {
    id: text().primaryKey(),
    perm: integer(),
    title: text(),
    limited: integer({mode: "boolean"}),
    quiet: integer({mode: "boolean"}),
});

export const GUILDS = sqliteTable("guilds", {
    id: text().primaryKey(),
    limited: integer({mode: "boolean"}),
    quiet: integer({mode: "boolean"}),
    prefix: text(),
});

export const CHANNELS = sqliteTable("channels", {
    id: text().primaryKey(),
    limited: integer({mode: "boolean"}),
    quiet: integer({mode: "boolean"}),
    prefix: text(),
});

export const LOCALES = sqliteTable("locales", {
    key: text().primaryKey(),
    value: text().notNull(),
});

export const PER_GUILD_LOCALES = sqliteTable("per_guild_locales",
    {
        guild: text().notNull(),
        key: text().notNull(),
        value: text().notNull(),
    },
    (t) => [primaryKey({columns: [t.guild, t.key]})]
);

export const FAQS = sqliteTable("faqs", {
    name: text().primaryKey(),
    author: text().notNull(),
    added_by: text().notNull(),
    content: text().notNull(),
    timestamp: integer({mode: "timestamp"}).notNull(),
    locked: integer({mode: "boolean"}).notNull(),
});

export type DBUser = typeof USERS.$inferSelect;
export type DBGuild = typeof GUILDS.$inferSelect;
export type DBChannel = typeof CHANNELS.$inferSelect;
export type DBLocale = typeof LOCALES.$inferSelect;
export type DBFaq = typeof FAQS.$inferSelect;