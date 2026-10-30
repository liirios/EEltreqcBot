import { Message, type Attachment, type Embed, type PartialMessage, type Sticker } from "discord.js";
import { mapAll } from "../utils";
import { ResolvedChannel } from "./channels";
import { ResolvedEmoji, type ResolvableEmoji } from "./emojis";
import { ResolvedGuild } from "./guilds";
import { ResolvedStarboard } from "./starboards";
import { ResolvedUser } from "./users";
import { labeledUrl } from "../string";

export type ResolvableMessage = ResolvedMessage | Message | PartialMessage | null | undefined;

export class ResolvedMessage {
	public id?: string;
	public message?: Message | PartialMessage | null;

	public constructor(target?: ResolvableMessage) {
		if (target instanceof ResolvedMessage) {
			this.id = target.id;
			this.message = target.message;
		} else if (target == null) {}
        else {
			this.id = target.id;
			this.message = target;
		}
	}

	public valid(): boolean {
		return !!this.id;
	}

	public resolved(): boolean {
		return !!this.raw;
	}

	// from
	public static from(target?: ResolvableMessage): ResolvedMessage {
		return target instanceof ResolvedMessage ? target : new ResolvedMessage(target);
	}

	public static fromReference(target: Message | null): ResolvedMessage {
		if (!target) return ResolvedMessage.from(null)
		const id = target.reference?.messageId;
		return ResolvedMessage.from(id ? target.channel.messages.cache.get(id) : null);
	}

	public static ids(targets: ResolvableMessage | ResolvableMessage[]): string[] {
		return mapAll(targets, (value) => ResolvedMessage.from(value).id);
	}

	// resolve
	public async resolve(): Promise<this> {
		if (!this.message || this.resolved()) return this;
		this.message = (await this.message.fetch().catch(() => null)) ?? this.message;
		return this;
	}

	// getters
	public get raw(): Message | undefined {
		return this.message && !this.message.partial ? this.message as Message : undefined;
	}

	public get content(): string {
		return this.message?.content ?? "";
	}

	public get attachments(): Attachment[] {
		return [...(this.message?.attachments.values() ?? [])];
	}

	public get stickers(): Sticker[] {
		return [...(this.message?.stickers.values() ?? [])];
	}

	public get embeds(): Embed[] {
		return this.message?.embeds ?? [];
	}

	public get channel(): ResolvedChannel {
		return ResolvedChannel.from(this.message?.channel);
	}

	public get guild(): ResolvedGuild {
		return ResolvedGuild.from(this.message?.guild);
	}

	public get author(): ResolvedUser {
		return ResolvedUser.from(this.message?.author);
	}

	public get reference(): ResolvedMessage {
		const id = this.message?.reference?.messageId;
		return ResolvedMessage.from(id ? this.message?.channel.messages.cache.get(id) : null);
	}

	public starboards(emoji?: ResolvableEmoji): ResolvedStarboard[] {
		const guild = this.guild;
		const channel = this.channel;
		if (!guild.valid() || !channel.valid()) return [];
		const target = emoji == null ? null : ResolvedEmoji.from(emoji, guild);
		return channel.starboards.filter((value) => !target || value.matches(target));
	}

	// discord
	public get url(): string | undefined {
		return this.message?.url;
	}

	public labeledUrl(label: string = "Jump to message"): string | undefined {
		return this.url ? labeledUrl(label, this.url) : undefined;
	}

	public static url(guild: string, channel: string, id: string): string {
		return `https://discord.com/channels/${guild}/${channel}/${id}`;
	}

	public static labeledUrl(guild: string, channel: string, id: string, label: string): string {
		return labeledUrl(label, ResolvedMessage.url(guild, channel, id));
	}
}