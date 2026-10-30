import { EmbedBuilder, Guild, GuildFeature } from "discord.js";
import { container } from "@sapphire/framework";
import { DEFAULT_EMBED_COLOR } from "../config";
import type { IOM } from "../constants";
import { customOnlyPrefix, label, lines, mentionUser, toString } from "../string";
import { DBGuilds, type NotNullDBGuild } from "../db/db_guilds";
import { GUILDS } from "../db/db_schema";
import { CLR, ResolvedColorole } from "./coloroles";
import { Embedder } from "./embedders";
import { PRE, Prefixes } from "./prefixes";
import { ResolvedStarboard, SB } from "./starboards";
import { ResolvedTime } from "./timestamps";
import { mapAll } from "../utils";

export type ResolvableGuild = ResolvedGuild | Guild | IOM | string | null | undefined;

export const GLD = new DBGuilds(GUILDS).sync();

export class ResolvedGuild {
	public id?: string;
	public guild?: Guild | null;
	public dbguild: NotNullDBGuild;

	public constructor(target?: ResolvableGuild) {
		if (target instanceof ResolvedGuild) Object.assign(this, target);
		else if (target == null) {}
        else if (typeof target === "string") this.id = target;
		else if (target instanceof Guild) {
			this.id = target.id;
			this.guild = target;
		} else {
			this.id = target.guild?.id;
			this.guild = target.guild;
		}
		this.dbguild = this.id ? GLD.getOrDefault(this.id) : GLD.default();
	}

	public valid(): boolean {
		return !!this.id;
	}

	public resolved(): boolean {
		return !!this.guild;
	}

	// from
	public static from(target?: ResolvableGuild): ResolvedGuild {
		return target instanceof ResolvedGuild ? target : new ResolvedGuild(target);
	}

	public static ids(targets: ResolvableGuild | ResolvableGuild[]): string[] {
		return mapAll(targets, (value) => ResolvedGuild.from(value).id);
	}

	// resolve
	public async resolve(force = false): Promise<this> {
		if (!this.valid() || (this.resolved() && !force)) return this;
		const guild = await container.client.guilds.fetch({guild: this.id!, force}).catch(() => null);
		this.guild = guild ?? this.guild ?? null;
		return this;
	}

	// getters
	public get enhancedRoleColors(): boolean {
		return !!this.guild?.features.includes(GuildFeature.EnhancedRoleColors);
	}

	public get starboards(): ResolvedStarboard[] {
		return this.id ? SB.getForGuild(this.id).map((value) => new ResolvedStarboard(value, this)) : [];
	}

	public get coloroles(): ResolvedColorole[] {
		return this.id ? CLR.getForGuild(this.id).map((value) => new ResolvedColorole(value, this)) : [];
	}

	public getName(def: string = "null"): string {
		return this.guild?.name ?? def;
	}

	public getPrefix(): string {
		const prefix = PRE.getForGuild(this.id)
		if (prefix === undefined) return PRE.getGlobal();
		return Prefixes.format([prefix])[0];
	}

	// text
	public get label(): string {
		return label("Guild", this.id);
	}

	public short(): string {
		if (!this.valid()) return "";
		return `${this.label} - ${this.guild ? `${this.getName()} (${this.guild.memberCount} members)` : "UNKNOWN"}`;
	}

	public entry(): string {
		if (!this.valid()) return "";
		return `- ${this.id} - ${this.guild ? `${this.getName()} (${this.guild.memberCount} members)` : "UNKNOWN"}`;
	}

	public full(): string {
		if (!this.valid()) return "";
		const guild = this.guild;
		const prefix = customOnlyPrefix(this.getPrefix());
		const starboards = this.starboards.length;
		const coloroles = this.coloroles.length;

		return lines([
			`${this.label}:`,
			`- name: ${guild?.name ?? ""}`,
			`- owner: ${guild ? mentionUser(guild.ownerId) : ""}`,
			`- description: ${guild?.description ?? ""}`,
			`- members: ${guild?.memberCount ?? ""}`,
			guild!.roles.cache.size ? `- roles: ${guild!.roles.cache.size}` : "",
			guild!.channels.cache.size ? `- channels: ${guild!.channels.cache.size}` : "",
			guild ? `- created: ${ResolvedTime.AnRMention(guild.createdAt)}` : "",
			prefix ? `- prefix: ${prefix}` : "",
			this.enhancedRoleColors ? `- gradient roles: true` : "",
			starboards ? `- starboards: ${starboards}` : "",
			coloroles ? `- coloroles: ${coloroles}` : ""
		]);
	}

	// embeds
	private embedBase(): Embedder {
		return new Embedder()
			.setAuthor(this.label)
			.setTitle(this.getName("UNKNOWN"))
			.setColor(DEFAULT_EMBED_COLOR)
			.setThumbnail(this.guild?.iconURL() ?? null);
	}

	public shortEmbed(): EmbedBuilder {
		if (!this.valid()) return new EmbedBuilder();
		const guild = this.guild;

		const e = this.embedBase();

		e.addField("owner", guild ? mentionUser(guild.ownerId) : "", true);
		e.addField("members", this.guild ? String(this.guild.memberCount) : "", true);

		return e.build();
	}

	public fullEmbed(): EmbedBuilder {
		if (!this.valid() || !this.resolved()) return new EmbedBuilder();

		const guild = this.guild;
		const prefix = customOnlyPrefix(this.getPrefix());

		const e = this.embedBase()
			.setDescription(guild?.description ?? "")
			.setImage(guild?.bannerURL() ?? null);

		e.addField("owner", guild ? mentionUser(guild.ownerId) : "", true);
		e.addField("members", guild ? String(guild.memberCount) : "", true);
		e.addField("roles", toString(guild!.roles.cache.size))
		e.addField("channels", toString(guild!.channels.cache.size))
		e.addField("created", ResolvedTime.AnRMention(guild?.createdAt), true);
		e.addField("prefix", prefix, true);
		e.addField("starboards", toString(this.starboards.length), true);
		e.addField("coloroles", toString(this.coloroles.length), true);

		return e.build();
	}
}