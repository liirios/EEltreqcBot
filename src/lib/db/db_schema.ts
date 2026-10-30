import { sqliteTable, text, integer, primaryKey, foreignKey, unique } from "drizzle-orm/sqlite-core";
import { EXP_EVENTS, SCOPES } from "./db_enum";
import { PREFIX } from "../config";

type Whitelist = {mode: "whitelist" | "blacklist", ids: string[]};
type Origin = {by: string | null, at: number};

// actions
// export const ACTIONS = sqliteTable("actions", {
// 	id: text().primaryKey(),
// 	trigger: text({enum: ACTION_TRIGGERS}),
// 	trigger_args: textArray(),
// 	action: text({enum: ACTION_ACTIONS}),
// 	action_args: textArray()
// });

// locales
export const LOCALES = sqliteTable("locales",
	{
		scope: text({enum: SCOPES}).notNull(),
		scope_id: text().notNull().default(""),
		key: text().notNull(),
		value: text().notNull()
	},
	(t) => [primaryKey({columns: [t.scope, t.scope_id, t.key]})]
);

// users
export const USERS = sqliteTable("users",
	{
		scope: text({enum: SCOPES}).notNull(),
		scope_id: text().notNull().default(""),
		id: text().notNull(),
		perm: integer(),
		title: text(),
		limited: integer({mode: "boolean"}),
		quiet: integer({mode: "boolean"})
	},
	(t) => [primaryKey({columns: [t.scope, t.scope_id, t.id]})]
);

// guilds
export const GUILDS = sqliteTable("guilds", {
	id: text().primaryKey(),
	limited: integer({mode: "boolean"}),
	quiet: integer({mode: "boolean"})
});

// channels
export const CHANNELS = sqliteTable("channels", {
	id: text().primaryKey(),
	limited: integer({mode: "boolean"}),
	quiet: integer({mode: "boolean"})
});

// prefixes
export const PREFIXES = sqliteTable("prefixes",
	{
		scope: text({enum: SCOPES}).notNull(),
		scope_id: text().notNull().default(""),
		value: text().default(PREFIX)
	},
	(t) => [primaryKey({columns: [t.scope, t.scope_id]})]
);

// faqs (draconic)
export const FAQS = sqliteTable("faqs", {
	name: text().primaryKey(),
	author: text().notNull(),
	added_by: text().notNull(),
	content: text().notNull(),
	timestamp: integer({mode: "timestamp"}).notNull(),
	locked: integer({mode: "boolean"}).notNull()
});

// starboards
export const STARBOARDS = sqliteTable("starboards",
	{
		guild: text().notNull(),
		id: text().notNull(),
		emoji: text().notNull(),
		channel: text().notNull(),
		threshold: integer().notNull().default(3),
		delete_threshold: integer().notNull().default(1),

		allow_self: integer({mode: "boolean"}).notNull().default(false),
		allow_bots: integer({mode: "boolean"}).notNull().default(false),
		sync_on_edit: integer({mode: "boolean"}).notNull().default(true),
		remove_on_delete: integer({mode: "boolean"}).notNull().default(true),
		clear_db_on_delete: integer({mode: "boolean"}).notNull().default(true),

		whitelist: text({mode: "json"}).$type<Whitelist>(),

		enabled: integer({mode: "boolean"}).notNull().default(true),
		origin: text({mode: "json"}).$type<Origin>().notNull().$defaultFn(() => ({by: null, at: Date.now()}))
	},
	(t) => [
		primaryKey({columns: [t.guild, t.id]}),
		unique().on(t.guild, t.emoji)
	]
); // fuck no im good, screw high adaptability
// i wont add too much unless its necessary, im tired already
// making this "modular" is alr cause users just use reactions to interact with it
// so only admins need to provide starboard id to do smth

export const STARBOARD_MESSAGES = sqliteTable("starboard_messages",
	{
		guild: text().notNull(),
		emoji: text().notNull(),
		message: text().notNull(),
		channel: text().notNull(),
		author: text().notNull(),
		starboard_channel: text(),
		starboard_message: text(),
		stars: integer().notNull().default(0),
		max_stars: integer().notNull().default(0),
		created_at: integer({mode: "timestamp"}).notNull(),
		starboarded_at: integer({mode: "timestamp"}),
		updated_at: integer({mode: "timestamp"}),
		forced: integer({mode: "boolean"}).notNull().default(false),
		locked: integer({mode: "boolean"}).notNull().default(false)
	},
	(t) => [
		primaryKey({columns: [t.guild, t.emoji, t.message]}),
		foreignKey({columns: [t.guild, t.emoji], foreignColumns: [STARBOARDS.guild, STARBOARDS.emoji]}).onDelete("cascade").onUpdate("cascade")
	]
);

// experience
export const EXPERIENCE = sqliteTable("experience",
	{
		guild: text().notNull(),
		level_formula: text().notNull().default("level*100"),
		max_level: integer().default(100),

		notify_channel: text("*"),

		whitelist: text({mode: "json"}).$type<Whitelist>(),

		enabled: integer({mode: "boolean"}).notNull().default(true),
		origin: text({mode: "json"}).$type<Origin>().notNull().$defaultFn(() => ({by: null, at: Date.now()}))
	},
	(t) => [primaryKey({columns: [t.guild]})]
);
// BUT HERE i cannot do such "modular" thing, cause it would be inconvenient for users
// so /pay @someone {amount} becomes /pay {id} @someone {amount}, and remember that @someone and {amount} can be flipped in order
// and also @someone can be a user id as well
// but limiting it to one singular currency type for guild looses ALOT of flexibility

export const EXPERIENCE_USERS = sqliteTable("experience_users",
	{
		guild: text().notNull(),
		user: text().notNull(),
		exp: integer().default(0),
		messages: integer().default(0)
	},
	(t) => [
		primaryKey({columns: [t.guild, t.user]}),
		foreignKey({columns: [t.guild], foreignColumns: [EXPERIENCE.guild]}).onDelete("cascade").onUpdate("cascade")
	]
);

export const EXPERIENCE_EVENTS = sqliteTable("experience_events",
	{
		guild: text().notNull(),
		id: text().notNull(),

		event: text({enum: EXP_EVENTS}).notNull(),
		argument: text(),
		formula: text().default("1"),
		cooldown: integer(),

		enabled: integer({mode: "boolean"}).notNull().default(true),
		origin: text({mode: "json"}).$type<Origin>().notNull().$defaultFn(() => ({by: null, at: Date.now()}))
	},
	(t) => [
		primaryKey({columns: [t.guild, t.id]}),
		foreignKey({columns: [t.guild], foreignColumns: [EXPERIENCE.guild]}).onDelete("cascade").onUpdate("cascade")
	]
);
// i cant came up with better way to do this
// if i make it in main experience db then i need to add at least 2 new columns per new experience source
// and i dont want to overuse json, for origin its fine cause i dont want to make 2 or possibly more columns for each table
// and whitelist is just its type (black/white list) with string[] so no big deal again

export const EXPERIENCE_MILESTONES = sqliteTable("experience_milestones",
	{
		guild: text().notNull(),
		id: text().notNull(),

		enabled: integer({mode: "boolean"}).notNull().default(true),
		origin: text({mode: "json"}).$type<Origin>().notNull().$defaultFn(() => ({by: null, at: Date.now()}))
	},
	(t) => [
		primaryKey({columns: [t.guild, t.id]}),
		foreignKey({columns: [t.guild], foreignColumns: [EXPERIENCE.guild]}).onDelete("cascade").onUpdate("cascade")
	]
);

// colors
export const COLORS = sqliteTable("colors",
	{
		name: text().notNull(),
		hex: text().notNull(),
		origin: text({mode: "json"}).$type<Origin>().notNull().$defaultFn(() => ({by: null, at: Date.now()}))
	},
	(t) => [primaryKey({columns: [t.hex, t.name]})]
);

// coloroles
export const COLOROLES = sqliteTable("coloroles",
	{
		guild: text().notNull(),
		id: text().notNull(),
		role: text().notNull(),
		name: text().notNull(),
		auto_name: integer({mode: "boolean"}).notNull().default(true),

		primary: text().notNull(),
		secondary: text(),
		tertiary: text(),

		origin: text({mode: "json"}).$type<Origin>().notNull().$defaultFn(() => ({by: null, at: Date.now()}))
	},
	(t) => [primaryKey({columns: [t.guild, t.id]})]
);

// autoroles
// export const AUTOROLES = sqliteTable("autoroles",
// 	{
// 		id: integer().primaryKey({autoIncrement: true}),
// 		guild: text().notNull(),
// 		role: text().notNull(),
// 		action: text().notNull(), // smth like add, remove
// 		trigger: text().notNull(), // smth like join, screening, verify, boost
// 		allow_users: integer({mode: "boolean"}).notNull().default(true),
// 		allow_bots: integer({mode: "boolean"}).notNull().default(false),
// 		delay: integer(), // delay after trigger
// 		min_age: integer(),
// 		max_age: integer(),
// 		require_roles: text(),
// 		exclude_roles: text(),
// 		require_avatar: integer({mode: "boolean"}), // null: idc, true: must, false: mustnt
// 		enabled: integer({mode: "boolean"}).notNull().default(true),
// 		creator: text(),
// 		created: integer({mode: "timestamp"})
// 	},
// 	(t) => [unique().on(t.id, t.guild)]
// );

export type DBLocale = typeof LOCALES.$inferSelect;
export type NewDBLocale = typeof LOCALES.$inferInsert;

export type DBUser = typeof USERS.$inferSelect;
export type NewDBUser = typeof USERS.$inferInsert;

export type DBGuild = typeof GUILDS.$inferSelect;
export type NewDBGuild = typeof GUILDS.$inferInsert;

export type DBChannel = typeof CHANNELS.$inferSelect;
export type NewDBChannel = typeof CHANNELS.$inferInsert;

export type DBPrefix = typeof PREFIXES.$inferSelect;
export type NewDBPrefix = typeof PREFIXES.$inferInsert;

export type DBFaq = typeof FAQS.$inferSelect;
export type NewDBFaq = typeof FAQS.$inferInsert;

export type DBStarboard = typeof STARBOARDS.$inferSelect;
export type NewDBStarboard = typeof STARBOARDS.$inferInsert;

export type DBStarboardMessage = typeof STARBOARD_MESSAGES.$inferSelect;
export type NewDBStarboardMessage = typeof STARBOARD_MESSAGES.$inferInsert;

export type DBColor = typeof COLORS.$inferSelect;
export type NewDBColor = typeof COLORS.$inferInsert;

export type DBColorole = typeof COLOROLES.$inferSelect;
export type NewDBColorole = typeof COLOROLES.$inferInsert;