import { BaseChannel, ChannelType, EmbedBuilder, type Channel } from "discord.js";
import { container } from "@sapphire/framework";
import { DEFAULT_EMBED_COLOR } from "../config";
import type { IOM } from "../constants";
import { customOnlyPrefix, label, lines, mentionChannel, toString } from "../string";
import { DBChannels, type NotNullDBChannel } from "../db/db_channels";
import { CHANNELS, type DBStarboard } from "../db/db_schema";
import { Embedder } from "./embedders";
import { ResolvedGuild } from "./guilds";
import { PRE, Prefixes } from "./prefixes";
import { ResolvedStarboard, SB } from "./starboards";
import { ResolvedTime } from "./timestamps";
import { mapAll } from "../utils";

export type ResolvableChannel = ResolvedChannel | Channel | BaseChannel | IOM | string | null | undefined;

export const CNL = new DBChannels(CHANNELS).sync();

export class ResolvedChannel {
	public id?: string;
	public channel?: Channel | null;
	public dbchannel: NotNullDBChannel;

	public constructor(target?: ResolvableChannel) {
		if (target instanceof ResolvedChannel) Object.assign(this, target);
		else if (target == null) {}
        else if (typeof target === "string") this.id = target;
		else if (target instanceof BaseChannel || "isDMBased" in target) {
			this.id = target.id;
			this.channel = target as Channel;
		} else {
			this.id = target.channel?.id;
			this.channel = target.channel;
		}
		this.dbchannel = this.id ? CNL.getOrDefault(this.id) : CNL.default();
	}

	public valid(): boolean {
		return !!this.id;
	}

	public resolved(): boolean {
		return !!this.channel;
	}

	// from
	public static from(target?: ResolvableChannel): ResolvedChannel {
		return target instanceof ResolvedChannel ? target : new ResolvedChannel(target);
	}

	public static ids(targets: ResolvableChannel | ResolvableChannel[]): string[] {
		return mapAll(targets, (value) => ResolvedChannel.from(value).id);
	}

	// resolve
	public async resolve(): Promise<this> {
		if (this.resolved() || !this.valid()) return this;
		this.channel = await container.client.channels.fetch(this.id!).catch(() => null);
		return this;
	}

	// getters
	public get type(): string {
		return this.channel ? ChannelType[this.channel.type] : "";
	}

	public get parent(): string | null {
		const channel = this.channel;
		return channel && "parentId" in channel ? channel.parentId : null;
	}

	public get topic(): string | null {
		const channel = this.channel;
		return channel && "topic" in channel ? channel.topic : null;
	}

	public get nsfw(): boolean {
		const channel = this.channel;
		return channel && "nsfw" in channel ? channel.nsfw : false;
	}

	public get guild(): ResolvedGuild {
		return ResolvedGuild.from(this.channel && "guild" in this.channel ? this.channel.guild : null);
	}

	public get starboards(): ResolvedStarboard[] {
		return this.id ? SB.getForChannel(this.id).map((value: DBStarboard) => new ResolvedStarboard(value)) : [];
	}

	public getName(def: string = ""): string {
		return this.channel && "name" in this.channel ? (this.channel.name ?? def) : def;
	}

	public getPrefix(): string {
		const prefix = PRE.getForChannel(this.id)
		if (prefix === undefined) return PRE.getGlobal();
		return Prefixes.format([prefix])[0];
	}

	public isSendable(): boolean {
		if (!this.channel) return false;
		return this.channel.isSendable();
	}
    
    // mention
	public get mention(): string | undefined {
		return this.id ? mentionChannel(this.id) : undefined;
	}

	public static mention(id: string): string {
		return mentionChannel(id);
	}

	// text
	public get label(): string {
		return label("Channel", this.id);
	}

	public short(): string {
		if (!this.valid()) return "";
		return `${this.label} - ${this.getName("UNKNOWN")} ${this.mention}`;
	}

	public entry(): string {
		if (!this.valid()) return "";
		return `- ${this.id} - ${this.getName("UNKNOWN")} ${this.mention}`;
	}

	public full(): string {
		if (!this.valid()) return "";
		const channel = this.channel;
		const guild = this.guild.guild;
		const parent = this.parent;
		const prefix = customOnlyPrefix(this.getPrefix());
		const starboards = this.starboards.length;

		return lines([
			`${this.label} (${this.mention}):`,
			`- name: ${this.getName()}`,
			`- type: ${this.type}`,
			`- guild: ${guild ? `${guild.name} (${guild.id})` : ""}`,
			parent ? `- ${channel?.isThread() ? "parent" : "category"}: ${ResolvedChannel.mention(parent)}` : "",
			`- topic: ${this.topic ?? ""}`,
			this.nsfw ? `- nsfw: true` : "",
			channel?.createdAt ? `- created: ${ResolvedTime.AnRMention(channel.createdAt)}` : "",
			prefix ? `- prefix: ${prefix}` : "",
			starboards ? `- starboards: ${starboards}` : ""
		]);
	}

	// embeds
	private embedBase(): Embedder {
		return new Embedder()
			.setAuthor(this.label)
			.setTitle(this.getName("UNKNOWN"))
			.setColor(DEFAULT_EMBED_COLOR);
	}

	public shortEmbed(): EmbedBuilder {
		if (!this.valid()) return new EmbedBuilder();

		const e = this.embedBase();

		e.addField("mention", this.mention!, true);
		e.addField("type", this.type, true);

		return e.build();
	}

	public fullEmbed(): EmbedBuilder {
		if (!this.valid()) return new EmbedBuilder();
		const channel = this.channel;
		const guild = this.guild.guild;
		const parent = this.parent;
		const prefix = customOnlyPrefix(this.getPrefix());

		const e = this.embedBase().setDescription(this.topic ?? "");

		e.addField("mention", this.mention!, true);
		e.addField("type", this.type, true);
		e.addField("guild", guild ? `${guild.name} (${guild.id})` : "", true);
		e.addField(channel?.isThread() ? "parent" : "category", parent ? ResolvedChannel.mention(parent) : "", true);
		e.addField("nsfw", toString(this.nsfw), true);
		e.addField("created", ResolvedTime.AnRMention(channel?.createdAt), true);
		e.addField("prefix", prefix, true);
		e.addField("starboards", toString(this.starboards.length), true);

		return e.build();
	}
}