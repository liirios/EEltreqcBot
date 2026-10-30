import { EmbedBuilder, type Role } from "discord.js";
import chroma from "chroma-js";
import { DEFAULT_EMBED_COLOR } from "../config";
import { changedFields, compare, formatOrigin, label, lines } from "../string";
import { COLOROLES, type DBColorole, type NewDBColorole } from "../db/db_schema";
import { DBColoroles } from "../db/db_coloroles";
import { ResolvedColor } from "./colors";
import { Embedder } from "./embedders";
import { ResolvedGuild, type ResolvableGuild } from "./guilds";
import { ResolvedRole, type ResolvableRole } from "./roles";
import { ResolvedUser, type ResolvableUser } from "./users";

export type ResolvableColorole = ResolvedColorole | DBColorole | null | undefined;

export const CLR = new DBColoroles(COLOROLES).sync();

export class ResolvedColorole {
	public guild: ResolvedGuild;
	private row?: DBColorole | null;

	public constructor(target?: ResolvableColorole, guild?: ResolvableGuild) {
		if (target instanceof ResolvedColorole) {
			this.row = target.row;
		} else if (target == null) {
		} else {
			this.row = target;
		}
		this.guild = ResolvedGuild.from(guild ?? this.row?.guild);
	}

	public valid(): boolean {
		return this.dbcolorole !== undefined;
	}

	public resolved(): boolean {
		return this.valid() && this.guild.resolved();
	}

	// from
	public static from(target?: ResolvableColorole, guild?: ResolvableGuild): ResolvedColorole {
		return target instanceof ResolvedColorole ? target : new ResolvedColorole(target, guild);
	}

	public static byId(guild: ResolvableGuild, id: string): ResolvedColorole {
		const g = ResolvedGuild.from(guild);
		return new ResolvedColorole(g.id ? CLR.get(g.id, id) : undefined, g);
	}

	public static byName(guild: ResolvableGuild, name: string): ResolvedColorole {
		const g = ResolvedGuild.from(guild);
		return new ResolvedColorole(g.id ? CLR.getByName(g.id, name) : undefined, g);
	}

	public static byRole(guild: ResolvableGuild, role: ResolvableRole): ResolvedColorole {
		const g = ResolvedGuild.from(guild);
		const roleId = ResolvedRole.from(role, g).id;
		return new ResolvedColorole(g.id && roleId ? CLR.getByRole(g.id, roleId) : undefined, g);
	}

	// resolve
	public async resolve(): Promise<this> {
		if (this.valid() && !this.resolved()) await this.guild.resolve();
		return this;
	}

	// getters
	public get id(): string | undefined {
		return this.dbcolorole?.id;
	}

	public get getName(): string | undefined {
		return this.dbcolorole?.name;
	}

	public get colors(): string {
		const row = this.dbcolorole;
		return row ? [row.primary, row.secondary, row.tertiary].filter(Boolean).join(" ") : "";
	}

	public get color(): ResolvedColor {
		const row = this.dbcolorole;
		return new ResolvedColor(row ? [row.primary, row.secondary, row.tertiary] : null);
	}

	public get role(): ResolvedRole {
		return new ResolvedRole(this.dbcolorole?.role, this.guild);
	}

	public get dbcolorole(): DBColorole | undefined {
		if (!this.row) return undefined;
		this.row = CLR.get(this.row.guild, this.row.id);
		return this.row ?? undefined;
	}

	public async discordRole(): Promise<Role | undefined | null> {
		const role = this.role;
		await role.resolve();
		return role.role;
	}

	public changesFrom(payload: Partial<DBColorole>): Partial<DBColorole> {
		const old = this.dbcolorole;
		return old ? changedFields(old, payload) : {};
	}

	// mention
	public get mention(): string | undefined {
		return this.role.mention;
	}

	// setters
	public static async create(guild: ResolvableGuild, colors: string[], by: string | null = null): Promise<ResolvedColorole | null> {
		const g = await ResolvedGuild.from(guild).resolve();
		const [primary, secondary = null, tertiary = null] = colors;
		if (!g.id || !g.guild || !primary) return null;

		const color = new ResolvedColor([primary, secondary, tertiary]);
		const name = color.name;
		if (CLR.getByName(g.id, name, false)) return null;

		const {primaryColor, secondaryColor, tertiaryColor} = color.toDiscord(g.enhancedRoleColors);
		const roleColors = {
			primaryColor,
			secondaryColor: secondaryColor ?? undefined,
			tertiaryColor: tertiaryColor ?? undefined
		};

		const me = g.guild.members.me ?? await g.guild.members.fetchMe().catch(() => null);
		const top = me?.roles.highest.position ?? 0;
		const position = top > 1 ? top - 1 : undefined;

		const role = await g.guild.roles.create({name, colors: roleColors, position, reason: "Colorole add"}).catch(() => null);
		if (!role) return null;

		const row = CLR.create(g.id, {
			role: role.id,
			primary, secondary, tertiary,
			name,
			auto_name: true,
			origin: {by, at: Date.now()}
		});
		return new ResolvedColorole(row, g);
	}

	public async applyTo(user: ResolvableUser, exclusive = true, reason = "Colorole apply"): Promise<boolean> {
		const target = await ResolvedUser.from(user).resolve(this.guild.id ?? "");
		const role = await this.discordRole();
		if (!target.member || !role) return false;

		if (exclusive) await ResolvedColorole.clearFrom(this.guild, target, reason, this);
		return target.hasDiscordRoles(role) || target.addDiscordRole(role, reason);
	}

	public async removeFrom(user: ResolvableUser, reason = "Colorole reset"): Promise<boolean> {
		const target = await ResolvedUser.from(user).resolve(this.guild.id ?? "");
		return target.removeDiscordRole(this.role, reason);
	}

	public static async clearFrom(guild: ResolvableGuild, user: ResolvableUser, reason = "Colorole reset", except?: ResolvableColorole): Promise<boolean> {
		const g = ResolvedGuild.from(guild);
		const target = await ResolvedUser.from(user).resolve(g.id ?? "");
		const skip = ResolvedColorole.from(except).id;
		const roles = g.coloroles.filter((value) => value.dbcolorole?.id !== skip).map((value) => value.role);
		return target.removeDiscordRole(roles, reason);
	}

	public async setDiscordRoleName(name?: string, reason = "Colorole update") {
		const row = this.dbcolorole;
		const role = await this.discordRole();
		if (!row || !role) return;
		return role.edit({name: name ?? row.name, reason});
	}

	public async setDiscordRoleColor(primary?: string, secondary?: string | null, tertiary?: string | null, reason = "Colorole sync") {
		const row = this.dbcolorole;
		const role = await this.discordRole();
		if (!row || !role) return;

		const color = new ResolvedColor([
			primary ?? row.primary,
			secondary === undefined ? row.secondary : secondary,
			tertiary === undefined ? row.tertiary : tertiary
		]);
		return role.edit({colors: color.toDiscord(this.guild.enhancedRoleColors), reason});
	}

	public async syncDiscordRole(reason = "Colorole sync") {
		const row = this.dbcolorole;
		const role = await this.discordRole();
		if (!row || !role) return;
		return role.edit({name: row.name, colors: this.color.toDiscord(this.guild.enhancedRoleColors), reason});
	}

	public async deleteDiscordRole(reason = "Colorole sync") {
		const role = await this.discordRole();
		if (role) await role.delete(reason);
	}

	public update(data: Partial<Omit<NewDBColorole, "guild" | "id">>) {
		const row = this.dbcolorole;
		if (!row) return;

		const colorChanged = data.primary !== undefined || data.secondary !== undefined || data.tertiary !== undefined;
		const autoName = data.auto_name ?? row.auto_name;
		const shouldRename = data.name === undefined && autoName && (colorChanged || data.auto_name === true);

		if (shouldRename) {
			const name = new ResolvedColor([
				data.primary === undefined ? row.primary : data.primary,
				data.secondary === undefined ? row.secondary : data.secondary,
				data.tertiary === undefined ? row.tertiary : data.tertiary
			]).name;
			data = {...data, name};
		}

		this.row = CLR.update(row.guild, row.id, data);
	}

	public setName(name: string) {
		this.update({name});
	}

	public setColor(primary: string, secondary: string | null = null, tertiary: string | null = null) {
		this.update({primary, secondary, tertiary});
	}

	public delete() {
		const row = this.dbcolorole;
		if (row) CLR.delete(row.guild, row.id);
		this.row = undefined;
	}

	// events
	public async onDiscordRoleUpdate() {
		const role = await this.discordRole();
		const before = this.dbcolorole;
		if (!role || !before) return;

		const {primaryColor, secondaryColor, tertiaryColor} = role.colors;
		const colors = {
			primary: chroma(primaryColor).hex(),
			secondary: secondaryColor != null ? chroma(secondaryColor).hex() : null,
			tertiary: tertiaryColor != null ? chroma(tertiaryColor).hex() : null
		};

		const colorsChanged = (["primary", "secondary", "tertiary"] as const).some((value) => !compare(colors[value], before[value], false));

		this.update(colorsChanged && before.auto_name ? colors : {...colors, name: role.name});

		const row = this.dbcolorole;
		if (row && row.name !== role.name) await this.setDiscordRoleName(row.name, "Colorole auto name");
		return row;
	}

	public onDiscordRoleDelete() {
		this.delete();
	}

	// text
	public get label(): string {
		return label("Colorole", this.id);
	}

	private get roleText(): string {
		return this.mention ?? "unknown role";
	}

	public short(): string {
		const row = this.dbcolorole;
		return row ? `${this.label} - ${row.name} (${this.colors}) ${this.roleText}` : "";
	}

	public entry(): string {
		const row = this.dbcolorole;
		return row ? `- ${row.id} - ${row.name} (${this.colors}) ${this.roleText}` : "";
	}

	public full(): string {
		const row = this.dbcolorole;
		if (!row) return "";

		return lines([
			`${this.label}:`,
			`- name: ${row.name}`,
			`- guild: ${row.guild}`,
			`- role: ${this.roleText}`,
			`- auto_name: ${row.auto_name}`,
			`- primary: ${row.primary}`,
			`- secondary: ${row.secondary ?? "none"}`,
			`- tertiary: ${row.tertiary ?? "none"}`,
			`- created: ${formatOrigin(row.origin)}`
		]);
	}

	// embeds
	private baseEmbed(row: DBColorole): Embedder {
		return new Embedder()
			.setAuthor(this.label)
			.setTitle(row.name)
			.setColor(this.color.num ?? DEFAULT_EMBED_COLOR);
	}

	public shortEmbed(): EmbedBuilder {
		const row = this.dbcolorole;
		if (!row) return new EmbedBuilder();

		const e = this.baseEmbed(row);

		e.addField("role", this.roleText, true);
		e.addField("colors", this.colors, true);

		return e.build();
	}

	public fullEmbed(): EmbedBuilder {
		const row = this.dbcolorole;
		if (!row) return new EmbedBuilder();

		const e = this.baseEmbed(row);

		e.addField("role", this.roleText, true);
		e.addField("guild", row.guild, true);
		e.addField("auto_name", String(row.auto_name), true);
		e.addField("primary", row.primary, true);
		e.addField("secondary", row.secondary ?? "", true);
		e.addField("tertiary", row.tertiary ?? "", true);
		e.addField("created", formatOrigin(row.origin), true);

		return e.build();
	}

	// images
	private get tileLabel(): string {
		const row = this.dbcolorole;
		return row ? `${row.id}: ${row.name}` : "";
	}

	public static async image(target: ResolvedColorole | ResolvedColorole[]): Promise<Buffer> {
		const coloroles = [target].flat().filter((value) => value.valid());
		coloroles.sort((a, b) => Number(a.id) - Number(b.id));

		const items = coloroles.map((value) => ({color: value.color, label: value.tileLabel}));
		return ResolvedColor.sheet(items);
	}

	public async image(): Promise<Buffer> {
		return this.color.image(this.valid() ? this.tileLabel : undefined);
	}
}