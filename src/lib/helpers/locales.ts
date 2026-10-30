import { BaseChannel, Guild } from "discord.js";
import { Liquid } from "liquidjs";
import { readFileSync } from "fs";
import { join } from "path";
import { srcDir } from "../constants";
import { randomFrom } from "../utils";
import { DBLocales } from "../db/db_locales";
import { LOCALES, type DBLocale } from "../db/db_schema";
import { Scope } from "../db/db_enum";
import { ResolvedChannel } from "./channels";
import { ResolvedGuild } from "./guilds";

class BotDBLocalesCollection {
	public L: DBLocales;
	private engine: Liquid;

	public constructor(locales: typeof LOCALES, default_path?: string) {
		this.L = new DBLocales(locales);

		if (default_path) {
			const defaults: Record<string, string> = JSON.parse(readFileSync(default_path, "utf-8"));
			const rows: DBLocale[] = Object.entries(defaults).map(([key, value]) => ({scope: Scope.GLOBAL, scope_id: "", key, value}));
			this.L.sync(rows);
		}
		this.L.sync(undefined, false);

		this.engine = new Liquid();
		this.engine.registerFilter("random", (value) => randomFrom(String(value).split("|")));
	}

	// getters
	public async getFormatted(key: string, args: Record<string, string> = {}, scope: Scope = Scope.GLOBAL, scope_id: string = "", def?: any): Promise<string> {
		const loc = this.L.find(key, scope, scope_id)?.value ?? this.L.get(key, Scope.GLOBAL, "", def);
		return await this.engine.parseAndRender(String(loc), args);
	}

	public async getFormattedFrom(key: string, args: Record<string, string> = {}, target?: Guild | ResolvedGuild | BaseChannel | ResolvedChannel | null, def?: any): Promise<string> {
		if (target instanceof Guild || target instanceof ResolvedGuild) return this.getFormatted(key, args, Scope.GUILD, target.id, def);
		if (target instanceof BaseChannel || target instanceof ResolvedChannel) return this.getFormatted(key, args, Scope.CHANNEL, target.id, def);
		return this.getFormatted(key, args, undefined, undefined, def)
	}

	public async get(key: string, args: Record<string, string> = {}, scope: Scope = Scope.GLOBAL, scope_id: string = "", def?: any): Promise<string> {
		return this.getFormatted(key, args, scope, scope_id, def)
	}

	// setters
	// TODO
}

export const LOC = new BotDBLocalesCollection(LOCALES, join(srcDir, "default_locales.json"));