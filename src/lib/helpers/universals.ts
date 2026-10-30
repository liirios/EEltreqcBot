import { AttachmentBuilder, ChatInputCommandInteraction, ContextMenuCommandInteraction, EmbedBuilder, Message, MessageFlags, type Attachment, type BaseMessageOptions, type PermissionResolvable } from "discord.js";
import { Args, type ArgType } from "@sapphire/framework";
import { send, reply } from "@sapphire/plugin-editable-commands";
import { isGuildBasedChannel } from "@sapphire/discord.js-utilities";
import { MESSAGE_LIMIT } from "../config";
import type { IOM, ReplyFlags } from "../constants";
import { crop } from "../string";
import { Scope } from "../db/db_enum";
import { ResolvedChannel, type ResolvableChannel } from "./channels";
import { Grabber, type ResolvableGrabber } from "./grabbers";
import { ResolvedGuild } from "./guilds";
import { ResolvedMessage } from "./messages";
import { ResolvedUser } from "./users";

export type FileLike = Attachment | AttachmentBuilder;

export class UniversalMessage {
	public iom: IOM;
	public grab: Grabber;
	public author: ResolvedUser;
	public self: ResolvedUser;
	public guild: ResolvedGuild;
	public channel: ResolvedChannel;
	public reference: ResolvedMessage | null;
	public last?: Message;
	public target?: Message;
	public content = "";
	public contentMax = MESSAGE_LIMIT;
	public files: FileLike[] = [];
	public embeds: EmbedBuilder[] = [];
	public flags: ReplyFlags;

	public constructor(iom: IOM, grab?: ResolvableGrabber | null) {
		this.iom = iom;
		this.grab = Grabber.from(grab);
		this.author = ResolvedUser.authorFromIOM(iom);
		this.self = ResolvedUser.from(iom.client.user)
		this.guild = ResolvedGuild.from(iom);
		this.channel = ResolvedChannel.from(iom);
		this.reference = iom instanceof Message ? ResolvedMessage.fromReference(iom) : null;
		this.flags = this.userQuiet;

		if (iom instanceof Message) {
			this.content = iom.content;
			this.files = [...iom.attachments.values()];
			this.embeds = iom.embeds.map((value) => EmbedBuilder.from(value));
		}
	}

	// from
	public static from(iom: IOM, args?: unknown) {
		return new UniversalMessage(iom, args instanceof Args ? args : iom)
	}

	public static async fromDeferred(iom: IOM, args?: unknown) {
		return await new UniversalMessage(iom, args instanceof Args ? args : iom).defer()
	}

	// getters
	public get isMessage(): boolean {
		return this.iom instanceof Message;
	}

	public get isSlash(): boolean {
		return this.iom instanceof ChatInputCommandInteraction;
	}

	public get isContextMenu(): boolean {
		return this.iom instanceof ContextMenuCommandInteraction;
	}

	public get message(): Message {
		if (!(this.iom instanceof Message)) throw new Error("Not a message command");
		return this.iom;
	}

	public get slash(): ChatInputCommandInteraction {
		if (!(this.iom instanceof ChatInputCommandInteraction)) throw new Error("Not a slash command");
		return this.iom;
	}

	public get contextMenu(): ContextMenuCommandInteraction {
		if (!(this.iom instanceof ContextMenuCommandInteraction)) throw new Error("Not a contextmenu command");
		return this.iom;
	}

	public get userQuiet(): ReplyFlags {
		return this.isSlash && (this.slash.options.getBoolean("quiet") ?? false) ? MessageFlags.Ephemeral : undefined;
	}

	public get scope(): [scope: Scope, scopeId: string] {
		if (this.guild.valid()) return [Scope.GUILD, this.guild.id!];
		if (this.channel.valid()) return [Scope.CHANNEL, this.channel.id!];
		return [Scope.GLOBAL, ""];
	}

	private get quiet(): boolean {
		return this.flags === MessageFlags.Ephemeral;
	}

	private get responded(): boolean {
		return this.isSlash && (this.slash.deferred || this.slash.replied);
	}

	public prepare(): BaseMessageOptions {
		return {content: crop(this.contentMax, this.content), files: this.files, embeds: this.embeds};
	}

	public prepareEdit(): BaseMessageOptions {
		return {content: crop(this.contentMax, this.content), embeds: this.embeds};
	}

	public async pickUser<T2 = never>(field: string = "target", def?: T2, includeReference = true, includeAuthor = true): Promise<ResolvedUser | T2> {
		const picked = await this.grab.pick("user", field, null).catch(() => null);
		const reference = !picked && this.isMessage ? await ResolvedUser.fromMessageReference(this.message, null) : null;

		if (picked) return ResolvedUser.from(picked);
		else if (includeReference && reference) return reference;
		else if (includeAuthor && this.author.valid()) return this.author;
		return def === undefined ? ResolvedUser.from(null) : def;
	}

	public async pickUserAnd<T extends keyof ArgType, T2 = never, T3 = never>(type: T, field: string, def?: ArgType[T] | T2, userField = "target", includeReference = true, includeAuthor = true, userDef?: T3): Promise<{value: ArgType[T] | T2; user: ResolvedUser | T3}> {
		const first = await this.pickUser<null>(userField, null, false, false);
		const value = await this.grab.pick(type, field, def);
		const picked = first ?? await this.pickUser<null>(userField, null, false, false);
		const user = picked ?? await this.pickUser<T3>(userField, userDef, includeReference, includeAuthor);

		return {value, user};
	}

	// setters
	public autoQuiet(): this {
		this.flags = this.userQuiet;
		return this;
	}

	public setTarget(message?: Message | null): this {
		this.target = message ?? undefined;
		return this;
	}

	public setContent(content: string = ""): this {
		this.content = content;
		return this;
	}

	public addFiles(...files: FileLike[]): this {
		this.files.push(...files);
		return this;
	}

	public addEmbeds(...embeds: EmbedBuilder[]): this {
		this.embeds.push(...embeds);
		return this;
	}

	public setFiles(...files: FileLike[]): this {
		this.files = files;
		return this;
	}

	public setEmbeds(...embeds: EmbedBuilder[]): this {
		this.embeds = embeds;
		return this;
	}

	public setFlags(flags: ReplyFlags): this {
		this.flags = flags;
		return this;
	}

	public setQuiet(quiet: boolean = true): this {
		this.flags = quiet ? MessageFlags.Ephemeral : undefined;
		return this;
	}

	public async defer(): Promise<this> {
		if (this.isSlash) {
			if (!this.responded) await this.slash.deferReply(this.quiet ? {flags: MessageFlags.Ephemeral} : {});
			return this;
		}

		const channel = this.channel.channel;
		if (this.isMessage && channel?.isSendable() && !this.message.editedTimestamp) await channel.sendTyping();
		return this;
	}

	public async send(channel?: ResolvableChannel, content?: string): Promise<this> {
		if (content) this.setContent(content);

		const payload = this.prepare();
		if (this.isMessage && !channel) {
			this.last = await send(this.message, payload);
			return this;
		}

		const target = channel ? ResolvedChannel.from(channel) : this.channel;
		if (target.channel?.isSendable()) this.last = await target.channel.send(payload);
		return this;
	}

	public async reply(content?: string): Promise<this> {
		if (content) this.setContent(content);

		const payload = this.prepare();

		if (this.isSlash) {
			if (this.responded) this.last = await this.slash.editReply(payload);
			else this.last = await this.slash.reply({...payload, fetchReply: true, flags: this.flags});
			return this;
		}

		if (this.isMessage && this.channel.isSendable()) this.last = await reply(this.message, payload);
		return this;
	}

	public async editReply(content?: string): Promise<this> {
		if (content) this.setContent(content);

		const payload = this.prepareEdit();

		if (this.isSlash) {
			if (!this.responded) return await this.reply();
			this.last = this.target ? await this.slash.webhook.editMessage(this.target, payload) : await this.slash.editReply(payload);
			return this;
		}

		const edited = await (this.target ?? this.last)?.edit(payload);
		if (edited) this.last = edited;
		return this;
	}

	// errors
	public async handle(allowedPerm: undefined | number = 1, allowedGuildPerm: undefined | number = 1, allowNonGuild = false, allowDM = false, requiredUserPerms?: PermissionResolvable, requiredBotPerms?: PermissionResolvable, requiredUserRoles?: string[], requiredBotRoles?: string[]): Promise<UniversalMessage> {
		const channel = this.channel.channel;

		if (!channel) throw new Error("This channel is invalid for me")
		if (!allowDM && channel.isDMBased()) throw new Error("You cant use that in dms"); // TODO: make custom UserError
		if (!allowNonGuild && !this.guild.guild) throw new Error("You cant use that outside guilds");

		if (allowedPerm != null) this.author.requirePerm(allowedPerm);
		if (allowedGuildPerm != null && this.guild.valid()) this.author.requirePerm(allowedGuildPerm, this.guild);

		let self;
		if (this.guild.guild && isGuildBasedChannel(channel)) {
			if (requiredBotPerms || requiredBotRoles) self = await ResolvedUser.from(this.guild.guild.members.me).resolve(this.guild.guild)
			if (requiredUserPerms) this.author.requireDiscordPerms(channel, requiredUserPerms)
			if (requiredBotPerms && self) self.requireDiscordPerms(channel, requiredBotPerms)
			if (requiredUserRoles) this.author.requireDiscordRoles(requiredUserRoles)
			if (requiredBotRoles && self) self.requireDiscordRoles(requiredBotRoles)
		}

		return this
	}
}