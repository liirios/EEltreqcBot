import { EmbedBuilder, Guild, GuildMember, Message, PermissionsBitField, User, type GuildBasedChannel, type ImageURLOptions, type PermissionResolvable } from "discord.js";
import { container } from "@sapphire/framework";
import { AUTHOR_ID, DEFAULT_EMBED_COLOR } from "../config";
import { IMAGE_OPTIONS, THUMBNAIL_OPTIONS } from "../constants";
import type { IOM } from "../constants";
import { PermError } from "../perms";
import { label, labeledUrl, lines, mentionUser } from "../string";
import { DBUsers, type NotNullDBUser } from "../db/db_users";
import { USERS } from "../db/db_schema";
import { Scope } from "../db/db_enum";
import { Embedder } from "./embedders";
import { ResolvedGuild, type ResolvableGuild } from "./guilds";
import { ResolvedRole, type ResolvableRole } from "./roles";
import { ResolvedTime } from "./timestamps";

export type ResolvableUser = ResolvedUser | GuildMember | User | string | null | undefined;

export const USR = new DBUsers(USERS).sync();

// errors
export class DiscordPermError extends Error {
	public constructor(public missing: string[], public channelId?: string, public user?: ResolvableUser) {
		const mention = ResolvedUser.from(user).mention;
		super(`${mention ? `${mention} ` : ""}You need permissions${channelId ? ` in <#${channelId}>` : ""}: ${missing.join(", ")}`);
		this.name = "DiscordPermError";
	}
}

export class DiscordRoleError extends Error {
	public constructor(public missing: string[], public channelId?: string, public user?: ResolvableUser) {
		const mention = ResolvedUser.from(user).mention;
		super(`${mention ? `${mention} ` : ""}You need roles${channelId ? ` in <#${channelId}>` : ""}: ${missing.join(", ")}`);
		this.name = "DiscordRoleError";
	}
}

export class ResolvedUser {
	public id?: string;
	public user?: User | null;
	public member?: GuildMember | null;
	private fetched = false;

	public constructor(target?: ResolvableUser) {
		if (target instanceof ResolvedUser) Object.assign(this, target);
		else if (target == null) {}
		else if (typeof target === "string") this.id = target;
		else if (target instanceof GuildMember) {
			this.id = target.id;
			this.user = target.user;
			this.member = target;
		} else if (target instanceof User) {
			this.id = target.id;
			this.user = target;
		}
	}

	public valid(): boolean {
		return !!this.id;
	}

	public resolved(): boolean {
		return !!this.member;
	}

	public globalResolved(): boolean {
		return this.fetched;
	}

	// from
	public static from(target?: ResolvableUser): ResolvedUser {
		return target instanceof ResolvedUser ? target : new ResolvedUser(target);
	}

	public static authorFromIOM(iom: IOM): ResolvedUser {
		return ResolvedUser.from(iom instanceof Message ? iom.author : iom.user);
	}

	public static async fromMessageReference<T>(message: Message, def?: T): Promise<ResolvedUser | T | undefined> {
		const refId = message.reference?.messageId;
		const ref = refId ? await message.channel.messages.fetch(refId).catch(() => undefined) : undefined;
		const refMember = ref ? await message.guild?.members.fetch(ref.author.id).catch(() => undefined) : undefined;
		if (!refMember) return def;
		return ResolvedUser.from(refMember);
	}

	// resolve
	public async resolve(guild?: Guild | IOM | string | null, force = false): Promise<this> {
		if (!this.valid()) return this;

		if (force || !this.user) await this.resolveGlobal(force);
		if (guild && (force || !this.member)) this.member = await this.resolveMember(this.id!, guild);
		return this;
	}

	public async resolveGlobal(force = false): Promise<this> {
		if (!this.valid() || (this.fetched && !force)) return this;

		const user = await container.client.users.fetch(this.id!, {force}).catch(() => null);
		if (user) {
			this.user = user;
			this.fetched = true;
		} else if (!this.user) this.user = null;
		return this;
	}

	private async resolveMember(id: string, guild: Guild | IOM | null | undefined | string): Promise<GuildMember | null> {
		if (typeof guild === "string") guild = await container.client.guilds.resolve(guild);
		else if (guild instanceof Guild) {}
		else guild = guild?.guild;
		if (guild == null) return null;
		return guild.members.fetch(id).catch(() => null);
	}

	// getters
	private get botTag(): string {
		return this.user?.bot ? " (bot)" : "";
	}

	public get guild(): ResolvedGuild {
		return ResolvedGuild.from(this.member?.guild);
	}

	public get dbuser(): NotNullDBUser {
		return USR.get(this.id ?? "");
	}

	public get displayRoles() {
		const member = this.member;
		return member?.roles.cache.filter((value) => value.id !== member.guild.id).sort((a, b) => b.position-a.position);
	}

	public getRoles(): ResolvedRole[] {
		return [...(this.member?.roles.cache.values() ?? [])].map((value) => ResolvedRole.from(value));
	}

	public getColor<T>(def: T): number | T {
		return this.member?.displayColor ?? def;
	}

	public getName(def: string = ""): string {
		return this.member?.displayName ?? this.user?.displayName ?? def;
	}

	public getAvatarUrl(options?: ImageURLOptions, def?: string): string | undefined {
		return (this.member ?? this.user)?.displayAvatarURL(options) ?? def;
	}

	public getGlobalAvatarUrl(options?: ImageURLOptions, def?: string): string | undefined {
		return this.user?.displayAvatarURL(options) ?? def;
	}

	public getGuildAvatarUrl(options?: ImageURLOptions, def?: string): string | undefined {
		return this.member?.avatar ? this.member.displayAvatarURL(options) : def;
	}

	public getBannerUrl(options?: ImageURLOptions, def?: string): string | undefined {
		return this.user?.bannerURL(options) ?? def;
	}

	public getPerm(guild?: ResolvableGuild): number {
		const g = ResolvedGuild.from(guild);
		return (g.valid() ? USR.get(this.id ?? "", Scope.GUILD, g.id!) : this.dbuser).perm;
	}

	public isPrivileged(perm: number, guild?: ResolvableGuild): boolean {
		return this.getPerm(guild) >= perm || this.id === AUTHOR_ID;
	}
	
	public hasDiscordPerms(channel: GuildBasedChannel, perms: PermissionResolvable): boolean {
		const have = this.member && channel.permissionsFor(this.member);
		return !!have && have.has(perms);
	}

	public hasDiscordRoles(roles: ResolvableRole | ResolvableRole[]): boolean {
		const have = ResolvedRole.ids(this.getRoles());
		return !!this.member && ResolvedRole.ids(roles).every((value) => have.includes(value));
	}

	// setters
	public setPerm(perm: number, guild?: ResolvableGuild): boolean {
		if (!this.id) return false;
		if (guild === undefined) {
			USR.update(this.id, {perm});
			return true;
		}
		const g = ResolvedGuild.from(guild);
		if (!g.valid()) return false;
		USR.update(this.id, {perm}, Scope.GUILD, g.id!);
		return true;
	}

	public async addDiscordRole(roles: ResolvableRole | ResolvableRole[], reason?: string): Promise<boolean> {
		const member = this.member;
		if (!member) return false;

		const have = ResolvedRole.ids(this.getRoles());
		const missing = ResolvedRole.ids(roles).filter((value) => !have.includes(value));
		if (!missing.length) return false;

		try {
			await member.roles.add(missing, reason);
			return true;
		} catch {
			return false;
		}
	}

	public async removeDiscordRole(roles: ResolvableRole | ResolvableRole[], reason?: string): Promise<boolean> {
		const member = this.member;
		if (!member) return false;

		const have = ResolvedRole.ids(this.getRoles());
		const held = ResolvedRole.ids(roles).filter((value) => have.includes(value));
		if (!held.length) return false;

		try {
			await member.roles.remove(held, reason);
			return true;
		} catch {
			return false;
		}
	}

	// mention
	public get mention(): string | undefined {
		return this.id ? mentionUser(this.id) : undefined;
	}

	public static mention(id: string): string {
		return mentionUser(id);
	}

	// errors
	public requireDiscordPerms(channel: GuildBasedChannel, perms: PermissionResolvable) {
		if (this.hasDiscordPerms(channel, perms)) return;

		const have = this.member && channel.permissionsFor(this.member);
		throw new DiscordPermError(have ? have.missing(perms) : new PermissionsBitField(perms).toArray(), channel.id, this);
	}

	public requireDiscordRoles(roles: ResolvableRole | ResolvableRole[]) {
		if (this.hasDiscordRoles(roles)) return;

		const have = ResolvedRole.ids(this.getRoles());
		throw new DiscordRoleError(ResolvedRole.ids(roles).filter((value) => !have.includes(value)), undefined, this);
	}

	public requirePerm(perm: number, guild?: ResolvableGuild) {
		if (!this.isPrivileged(perm, guild)) throw new PermError(perm, this.getPerm(guild));
	}

	// text
	public get label(): string {
		return label("User", this.id);
	}

	private permText(): string {
		const member = this.member;
		return `perm^${this.getPerm()}${member ? ` (guild perm^${this.getPerm(member.guild)})` : ""}`;
	}

	public short(): string {
		if (!this.valid()) return "";

		return `${this.user?.username ?? "UNKNOWN"}${this.botTag} (${this.id}) - ${this.mention} ${this.permText()}`;
	}

	public entry(): string {
		if (!this.valid()) return "";

		return `- ${this.short()}`;
	}

	public full(): string {
		if (!this.valid()) return "";

		const user = this.user;
		const member = this.member;
		const roles = this.displayRoles;

		return lines([
			`${this.label} (${this.mention})${this.botTag}:`,
			`- username: ${user?.username ?? ""}`,
			`- global name: ${user?.globalName ?? ""}`,
			`- guild name: ${member?.nickname ?? ""}`,
			`- created: ${ResolvedTime.AnRMention(user?.createdAt)}`,
			member?.joinedAt ? `- joined guild ${member.guild.name}: ${ResolvedTime.AnRMention(member.joinedAt)}` : "",
			member?.premiumSince ? `- boosting since: ${ResolvedTime.AnRMention(member.premiumSince)}` : "",
			member?.isCommunicationDisabled() ? `- timed out until: ${ResolvedTime.AnRMention(member.communicationDisabledUntil)}` : "",
			`- accent color: ${user?.hexAccentColor ?? ""}`,
			`- flags: ${user?.flags?.toArray().join(", ") ?? ""}`,
			member ? `- display color: ${member.displayHexColor}` : "",
			roles?.size ? `- ${roles.size} roles: ${roles.map((value) => ResolvedRole.mention(value.id)).join(" ")}` : "",
			`- pfp: ${this.getGlobalAvatarUrl(IMAGE_OPTIONS) ?? ""}`,
			`- banner: ${this.getBannerUrl(IMAGE_OPTIONS) ?? ""}`,
			`- guild pfp: ${this.getGuildAvatarUrl(IMAGE_OPTIONS) ?? ""}`,
			`- perm: ${this.getPerm()}${member ? ` (guild: ${this.getPerm(member.guild)})` : ""}`
		]);
	}

	// embeds
	private baseEmbed(): Embedder {
		const user = this.user;

		return new Embedder()
			.setAuthor(`${this.label}${this.botTag}`, this.getAvatarUrl())
			.setTitle(`${user?.username ?? "UNKNOWN"} ${this.permText()}`)
			.setColor(this.getColor(0) || user?.accentColor || DEFAULT_EMBED_COLOR)
			.setThumbnail(this.getAvatarUrl(THUMBNAIL_OPTIONS) ?? null);
	}

	public shortEmbed(): EmbedBuilder {
		if (!this.valid()) return new EmbedBuilder();

		const e = this.baseEmbed();

		e.addField("mention", this.mention!, true);

		return e.build();
	}

	public fullEmbed(): EmbedBuilder {
		if (!this.valid()) return new EmbedBuilder();

		const user = this.user;
		const member = this.member;
		const roles = this.displayRoles;
		const banner = this.getBannerUrl(IMAGE_OPTIONS);
		const pfp = this.getGlobalAvatarUrl(IMAGE_OPTIONS);
		const guildPfp = this.getGuildAvatarUrl(IMAGE_OPTIONS);

		const e = this.baseEmbed().setImage(banner ?? null);

		e.addField("mention", this.mention!, true);
		e.addField("username", user?.username ?? "", true);
		e.addField("global name", user?.globalName ?? "", true);
		e.addField("guild name", member?.nickname ?? "", true);
		e.addField("created", ResolvedTime.AnRMention(user?.createdAt), true);
		e.addField(`joined ${member?.guild.name ?? "guild"}`, ResolvedTime.AnRMention(member?.joinedAt), true);
		e.addField("boosting since", ResolvedTime.AnRMention(member?.premiumSince), true);
		e.addField("timed out until", member?.isCommunicationDisabled() ? ResolvedTime.AnRMention(member.communicationDisabledUntil) : "", true);
		e.addField("accent color", user?.hexAccentColor ?? "", true);
		e.addField("flags", user?.flags?.toArray().join(", ") ?? "", true);
		e.addField("display color", member?.displayHexColor ?? "", true);
		e.addField("pfp", pfp ? labeledUrl("link", pfp) : "", true);
		e.addField("guild pfp", guildPfp ? labeledUrl("link", guildPfp) : "", true);
		e.addField("banner", banner ? labeledUrl("link", banner) : "", true);
		e.addField(`${roles?.size ?? 0} roles`, roles === undefined ? "" : roles.map((value) => ResolvedRole.mention(value.id)).join(" "));

		return e.build();
	}
}