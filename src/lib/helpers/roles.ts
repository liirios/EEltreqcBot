import type { Role } from "discord.js";
import { mapAll } from "../utils";
import { mentionRole } from "../string";
import { ResolvedGuild, type ResolvableGuild } from "./guilds";

export type ResolvableRole = ResolvedRole | Role | string | null | undefined;

export class ResolvedRole {
	public id?: string;
	public role?: Role | null;
	public guild: ResolvedGuild;

	public constructor(target?: ResolvableRole, guild?: ResolvableGuild) {
		let source: ResolvableGuild = guild;

		if (target instanceof ResolvedRole) {
			this.id = target.id;
			this.role = target.role;
			source ??= target.guild;
		} else if (target == null) {}
        else if (typeof target === "string") this.id = target;
		else {
			this.id = target.id;
			this.role = target;
			source ??= target.guild;
		}

		this.guild = ResolvedGuild.from(source);
	}

	public valid(): boolean {
		return !!this.id;
	}

	public resolved(): boolean {
		return !!this.role;
	}

	// from
	public static from(target?: ResolvableRole, guild?: ResolvableGuild): ResolvedRole {
		return target instanceof ResolvedRole ? target : new ResolvedRole(target, guild);
	}

	public static ids(targets: ResolvableRole | ResolvableRole[]): string[] {
		return mapAll(targets, (r) => ResolvedRole.from(r).id);
	}

	// resolve
	public async resolve(): Promise<this> {
		if (this.resolved() || !this.valid()) return this;
		await this.guild.resolve();
		this.role = (await this.guild.guild?.roles.fetch(this.id!).catch(() => null)) ?? null;
		return this;
	}

	// getters
	public getName(def: string = ""): string {
		return this.role?.name ?? def;
	}

	public getColor<T>(def: T): number | T {
		return this.role?.colors.primaryColor || def;
	}

	public getColors(): number[] {
		const c = this.role?.colors;
		return c ? [c.primaryColor, c.secondaryColor, c.tertiaryColor].filter((value): value is number => value != null) : [];
	}

	// discord
	public get mention(): string | undefined {
		return this.id ? mentionRole(this.id) : undefined;
	}

	public static mention(id: string): string {
		return mentionRole(id);
	}
}