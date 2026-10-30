import { EmbedBuilder, GuildEmoji, MessageReaction } from "discord.js";
import { Resolvers, type EmojiObject } from "@sapphire/framework";
import { DEFAULT_EMBED_COLOR } from "../config";
import { isNumeric, label, labeledUrl, lines, stripVariation, toString } from "../string";
import { Embedder } from "./embedders";
import { ResolvedGuild, type ResolvableGuild } from "./guilds";
import { ResolvedReaction, type ResolvableReaction } from "./reactions";
import { ResolvedStarboard, SB } from "./starboards";
import { ResolvedTime } from "./timestamps";
import { mapAll } from "../utils";

export type ResolvableEmoji = ResolvedEmoji | GuildEmoji | EmojiObject | ResolvableReaction | string | null | undefined;

export class ResolvedEmoji {
	public id?: string;
	public emoji?: GuildEmoji | null;
	public guild: ResolvedGuild;

	public constructor(target?: ResolvableEmoji, guild?: ResolvableGuild) {
		let source: ResolvableGuild = guild;

		if (target instanceof ResolvedEmoji) {
			this.id = target.id;
			this.emoji = target.emoji;
			source ??= target.guild;
		} else if (target == null) {
		} else if (target instanceof ResolvedReaction || target instanceof MessageReaction || (typeof target !== "string" && "emoji" in target)) {
			const reaction = target instanceof ResolvedReaction ? target : new ResolvedReaction(target as MessageReaction, guild);
			this.id = reaction.emoji.id;
			this.emoji = reaction.emoji.emoji;
			source ??= reaction.guild;
		} else if (typeof target === "string") this.id = stripVariation(target.trim());
		else if (target instanceof GuildEmoji) {
			this.id = target.id;
			this.emoji = target;
			source ??= target.guild;
		} else this.id = target.id ?? stripVariation(target.name ?? "");

		this.guild = ResolvedGuild.from(source);
	}

	public valid(): boolean {
		return !!this.id;
	}

	public resolved(): boolean {
		return this.valid() && (!this.isCustom() || !!this.emoji);
	}

	// from
	public static from(target?: ResolvableEmoji, guild?: ResolvableGuild): ResolvedEmoji {
		return target instanceof ResolvedEmoji ? target : new ResolvedEmoji(target, guild);
	}

	public static async fromString(guild: ResolvableGuild, input: string): Promise<ResolvedEmoji | undefined> {
		input = input.trim();
		const res = Resolvers.resolveEmoji(input);
		if (res.isErr()) return;

		const {id, name} = res.unwrap();
		if (id) {
			const custom = await new ResolvedEmoji(id, guild).resolve();
			return custom.emoji ? custom : undefined;
		}

		if (name && stripVariation(name) === stripVariation(input)) return new ResolvedEmoji(name, guild);
		return;
	}

	// resolve
	public async resolve(): Promise<this> {
		if (this.resolved() || !this.valid()) return this;
		await this.guild.resolve();
		this.emoji = (await this.guild.guild?.emojis.fetch(this.id!).catch(() => null)) ?? null;
		return this;
	}

	// getters
	public get type(): string {
		return this.isCustom() ? "custom" : "unicode";
	}

	public get starboards(): ResolvedStarboard[] {
		return this.id ? SB.getForEmoji(this.id).map((value) => new ResolvedStarboard(value)) : [];
	}

	public getDisplay(def?: string): string | undefined {
		return this.isCustom() ? (this.emoji?.toString() ?? def) : (this.id || def);
	}

	public isCustom(): boolean {
		return isNumeric(this.id ?? "");
	}

	public static ids(targets: ResolvableEmoji | ResolvableEmoji[]): string[] {
		return mapAll(targets, (value) => ResolvedEmoji.from(value).id);
	}

	// text
	public get label(): string {
		return label("Emoji", this.id);
	}

	public short(): string {
		if (!this.valid()) return "";
		return `${this.label} - ${this.getDisplay("UNKNOWN")} (${this.type})`;
	}

	public entry(): string {
		if (!this.valid()) return "";
		return `- ${this.getDisplay("UNKNOWN")} (${this.type})`;
	}

	public full(): string {
		if (!this.valid()) return "";
		const emoji = this.emoji;
		const starboards = this.starboards.length;

		return lines([
			`${this.label} (${this.getDisplay() ?? ""}):`,
			`- type: ${this.type}`,
			`- name: ${emoji?.name ?? ""}`,
			emoji?.animated ? `- animated: true` : "",
			emoji && emoji.available === false ? `- available: false` : "",
			emoji?.managed ? `- managed: true` : "",
			`- guild: ${emoji?.guild.name ?? this.guild.guild?.name ?? ""}`,
			emoji?.createdAt ? `- created: ${ResolvedTime.AnRMention(emoji.createdAt)}` : "",
			`- url: ${emoji?.imageURL() ?? ""}`,
			starboards ? `- starboards: ${starboards}` : ""
		]);
	}

	// embeds
	private baseEmbed(): Embedder {
		return new Embedder()
			.setAuthor(this.label)
			.setTitle(this.getDisplay("UNKNOWN")!)
			.setColor(DEFAULT_EMBED_COLOR)
			.setThumbnail(this.emoji?.imageURL() ?? null);
	}

	public shortEmbed(): EmbedBuilder {
		if (!this.valid()) return new EmbedBuilder();

		const e = this.baseEmbed();

		e.addField("type", this.type, true);

		return e.build();
	}

	public fullEmbed(): EmbedBuilder {
		if (!this.valid()) return new EmbedBuilder();
		const emoji = this.emoji;
		const url = emoji?.imageURL();

		const e = this.baseEmbed();

		e.addField("type", this.type, true);
		e.addField("name", emoji?.name ?? "", true);
		e.addField("guild", emoji?.guild.name ?? this.guild.guild?.name ?? "", true);
		e.addField("animated", toString(emoji?.animated), true);
		e.addField("available", emoji && emoji.available === false ? "false" : "", true);
		e.addField("managed", toString(emoji?.managed), true);
		e.addField("created", ResolvedTime.AnRMention(emoji?.createdAt), true);
		e.addField("url", url ? labeledUrl("link", url) : "", true);
		e.addField("starboards", toString(this.starboards.length), true);

		return e.build();
	}
}