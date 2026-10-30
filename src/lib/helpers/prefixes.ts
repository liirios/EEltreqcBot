import { container } from "@sapphire/framework";
import { mentionUser } from "../string";
import { DBPrefixes } from "../db/db_prefixes";
import { PREFIXES } from "../db/db_schema";
import { Scope } from "../db/db_enum";
import { ResolvedChannel, type ResolvableChannel } from "./channels";
import { ResolvedGuild, type ResolvableGuild } from "./guilds";

export class Prefixes {
	public dbprefixes: DBPrefixes;

	public constructor(dbprefixes: DBPrefixes) {
		this.dbprefixes = dbprefixes;
	}

	// getters
	public getGlobal(): string {
		return this.dbprefixes.globalPrefix;
	}

	public getForGuild(guild: ResolvableGuild): string | null | undefined {
		const id = ResolvedGuild.from(guild).id;
		return id ? this.dbprefixes.get(Scope.GUILD, id) : undefined;
	}

	public getForChannel(channel: ResolvableChannel): string | null | undefined {
		const id = ResolvedChannel.from(channel).id;
		return id ? this.dbprefixes.get(Scope.CHANNEL, id) : undefined;
	}

    public getAvailable(guild?: ResolvableGuild, channel?: ResolvableChannel, mentionable: boolean = true): (string | null)[] {
        const prefixes = [this.getGlobal(), this.getForGuild(guild), this.getForChannel(channel)];
        if (mentionable) prefixes.push(mentionUser(container.client.user?.id));
        return [...new Set(prefixes.filter((value): value is string | null => value !== undefined))];
    }

	public static isDisabled(prefixes: (string | null)[]): boolean {
		return prefixes.some((value) => value === null);
	}

	public static usable(prefixes: (string | null)[]): string[] {
		return prefixes.filter((value): value is string => value !== null);
	}

	// setters
	public setGlobal(value: string) {
		this.dbprefixes.set(value, Scope.GLOBAL);
	}

	public setForGuild(value: string | null, guild: ResolvableGuild): boolean {
		const id = ResolvedGuild.from(guild).id;
		if (!id) return false;
		this.dbprefixes.set(value, Scope.GUILD, id);
		return true;
	}

	public setForChannel(value: string | null, channel: ResolvableChannel): boolean {
		const id = ResolvedChannel.from(channel).id;
		if (!id) return false;
		this.dbprefixes.set(value, Scope.CHANNEL, id);
		return true;
	}

	public resetForGuild(guild: ResolvableGuild): boolean {
		const id = ResolvedGuild.from(guild).id;
		if (!id) return false;
		this.dbprefixes.delete(Scope.GUILD, id);
		return true;
	}

	public resetForChannel(channel: ResolvableChannel): boolean {
		const id = ResolvedChannel.from(channel).id;
		if (!id) return false;
		this.dbprefixes.delete(Scope.CHANNEL, id);
		return true;
	}

	// text
	public static format(prefixes: (string | null)[]): string[] {
		return prefixes.flatMap((value) => {
			if (value === null) return [];
			if (value === "") return ["any message"];
			if (value.startsWith("<") && value.endsWith(">")) return [value];
			return [`\`${value}\``];
		});
	}
}

export const PRE = new Prefixes(new DBPrefixes(PREFIXES).sync());