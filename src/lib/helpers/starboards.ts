import { AttachmentBuilder, EmbedBuilder, StickerFormatType, type Message } from "discord.js";
import { DEFAULT_EMBED_COLOR, MAX_EMBEDS, MAX_FILES, MAX_FILE_SIZE, MAX_IMAGES_IN_EMBED } from "../config";
import { compare, compareObjects, crop, formatChanges, formatOrigin, label, labeledUrl, lines } from "../string";
import { mentionChannel } from "../string";
import { DBStarboardMessages, DBStarboards } from "../db/db_starboards";
import { STARBOARD_MESSAGES, STARBOARDS, type DBStarboard, type DBStarboardMessage } from "../db/db_schema";
import { ResolvedChannel, type ResolvableChannel } from "./channels";
import { EMBED_DESCRIPTION_LIMIT, EMBED_FIELD_VALUE_LIMIT } from "../constants";
import { ResolvedEmoji } from "./emojis";
import { ResolvedGuild, type ResolvableGuild } from "./guilds";
import { ResolvedMessage, type ResolvableMessage } from "./messages";
import { ResolvedReaction, type ResolvableReaction } from "./reactions";
import { UniversalMessage } from "./universals";

export type ResolvableStarboard = ResolvedStarboard | DBStarboard | null | undefined;
export type Filter = NonNullable<DBStarboard["whitelist"]>;

export const SB = new DBStarboards(STARBOARDS).sync();
export const SBM = new DBStarboardMessages(STARBOARD_MESSAGES).sync();

export class ResolvedStarboard {
	public guild: ResolvedGuild;
	private row?: DBStarboard | null;

	public constructor(target?: ResolvableStarboard, guild?: ResolvableGuild) {
		if (target instanceof ResolvedStarboard) this.row = target.row;
		else if (target == null) {}
		else this.row = target;
		this.guild = ResolvedGuild.from(guild ?? this.row?.guild);
	}

	public valid(): boolean {
		return this.dbstarboard !== undefined;
	}

	public resolved(): boolean {
		return this.valid() && this.guild.resolved();
	}

	// from
	public static from(target?: ResolvableStarboard, guild?: ResolvableGuild): ResolvedStarboard {
		return target instanceof ResolvedStarboard ? target : new ResolvedStarboard(target, guild);
	}

	// resolve
	public async resolve(): Promise<this> {
		if (this.resolved() || !this.valid()) return this;
		await this.guild.resolve();
		return this;
	}

	// getters
	public get filter(): Filter {
		return this.row?.whitelist ?? {mode: "whitelist", ids: []};
	}

	public get dbstarboard(): DBStarboard | undefined {
		if (!this.row) return undefined;
		return (this.row = SB.get(this.row.guild, this.row.id));
	}

	public get channel(): ResolvedChannel {
		return ResolvedChannel.from(this.dbstarboard?.channel);
	}

	public get emoji(): ResolvedEmoji {
		return new ResolvedEmoji(this.dbstarboard?.emoji, this.guild);
	}

	public async getDisplay(): Promise<string> {
		return (await this.emoji.resolve()).getDisplay(this.dbstarboard?.emoji) ?? "";
	}

	public matches(emoji?: ResolvedEmoji | null): boolean {
		return !!emoji && emoji.valid() && this.dbstarboard?.emoji === emoji.id;
	}

	public message(message: string): DBStarboardMessage | undefined {
		const row = this.dbstarboard;
		return row ? SBM.get(row.guild, row.emoji, message) : undefined;
	} // TODO ????????????????????????????????????????????????????????????????????

	public changesFrom(payload: Partial<DBStarboard>): Partial<DBStarboard> {
		const old = this.dbstarboard;
		if (!old) return {};
		return Object.fromEntries(Object.entries(payload).filter(([key, value]) => value !== undefined && !compare(JSON.stringify(value), JSON.stringify(old[key as keyof DBStarboard])))) as Partial<DBStarboard>;
	}

	// setters
	public setFilter(filter: Filter) {
		if (!this.row) return;
		SB.update(this.row.guild, this.row.id, {whitelist: filter});
	}

	// text
	public get label(): string {
		return label("Starboard", this.dbstarboard?.id)
	}

	private async summary(row: DBStarboard): Promise<string> {
		return `${await this.getDisplay()}^${row.threshold}${row.delete_threshold <= 0 ? " (persistent)" : ` (delete on ${await this.getDisplay()}<${row.delete_threshold})`} in ${mentionChannel(row.channel)}${row.enabled ? "" : " (disabled)"}`;
	}

	public async short(): Promise<string> {
		const row = this.dbstarboard;
		if (!row) return "";
		return `${this.label} - ${await this.summary(row)}`;
	}

	public async entry(): Promise<string> {
		const row = this.dbstarboard;
		if (!row) return "";
		return `- ${row.id} - ${await this.summary(row)}`;
	}

	public async full(): Promise<string> {
		const row = this.dbstarboard;
		if (!row) return "";

		const filter = row.whitelist;
		const ids = filter?.ids.map((value) => ResolvedChannel.mention(value))

		return lines([
			`${this.label}:`,
			`- enabled: ${row.enabled}`,
			`- guild: ${row.guild}`,
			`- emoji: ${await this.getDisplay()}`,
			`- channel: ${mentionChannel(row.channel)}`,
			`- threshold: ${row.threshold}`,
			`- delete_threshold: ${row.delete_threshold}`,
			`- allow_self: ${row.allow_self}`,
			`- allow_bots: ${row.allow_bots}`,
			`- sync_on_edit: ${row.sync_on_edit}`,
			`- remove_on_delete: ${row.remove_on_delete}`,
			`- clear_db_on_delete: ${row.clear_db_on_delete}`,
			`- ${filter ? `${filter.mode}: (${ids ? ids.join(", ") : "empty"})` : "whitelist: none"}`,
			`- created: ${formatOrigin(row.origin)}`
		]);
	}

	public formatChanges(old: DBStarboard, changes: Partial<DBStarboard>): string {
		const {added, removed, edited} = compareObjects(
			{...old, channel: ResolvedChannel.mention(old.channel)},
			{...old, ...changes, channel: ResolvedChannel.mention(changes.channel ?? old.channel)}
		);
		return formatChanges(`${this.label} updated`, added, removed, edited);
	}
}

export class ResolvedStarboardMessage {
	public starboard: ResolvedStarboard;
	public message: ResolvedMessage;
	public reaction?: ResolvedReaction;
	private pending_stars = 0;

	public constructor(message: ResolvableMessage, starboard?: ResolvableStarboard, reaction?: ResolvableReaction) {
		this.message = ResolvedMessage.from(message);
		this.starboard = ResolvedStarboard.from(starboard);
		this.reaction = reaction ? ResolvedReaction.from(reaction) : undefined;
	}

	// from
	public static fromMessageAndReaction(message: ResolvableMessage, reaction: ResolvableReaction): ResolvedStarboardMessage | null {
		const react = ResolvedReaction.from(reaction);
		const starboard = react.guild.starboards.find((value) => value.matches(react.emoji));
		return starboard ? new ResolvedStarboardMessage(message, starboard, react) : null;
	}

	// getters
	public get config() {
		return this.starboard.dbstarboard;
	}

	public get dbmessage(): DBStarboardMessage | undefined {
		const config = this.config;
		const id = this.message.id;
		return config && id ? SBM.get(config.guild, config.emoji, id) : undefined;
	}

	public get stars(): number {
		return this.dbmessage?.stars ?? this.pending_stars;
	}

	public get forced(): boolean {
		return !!this.dbmessage?.forced;
	}

	public get locked(): boolean {
		return !!this.dbmessage?.locked;
	}

	public get posted(): boolean {
		return !!this.dbmessage?.starboard_message;
	}

	public reachedThreshold(stars = this.stars): boolean {
		return this.forced || stars >= this.config!.threshold;
	}

	public reachedDeleteThreshold(stars = this.stars): boolean {
		const threshold = this.config!.delete_threshold;
		return !this.forced && threshold >= 0 && stars < threshold;
	}

	public static async getPostChannel(id: string) {
		const target = await ResolvedChannel.from(id).resolve();
		const channel = target.channel;
		if (!channel || channel.isDMBased() || !channel.isTextBased() || !target.isSendable()) return null;
		return channel;
	}

	// setters
	public async fetchPost(): Promise<Message | null> {
		const row = this.dbmessage;
		if (!row?.starboard_message || !this.config) return null;
		const channel = await ResolvedStarboardMessage.getPostChannel(row.starboard_channel ?? this.config.channel);
		return (await channel?.messages.fetch(row.starboard_message).catch(() => null)) ?? null;
	}

	public async post(channel?: ResolvableChannel): Promise<Message | null> {
		const raw = this.message.raw;
		const config = this.config;
		if (!raw || !config || !this.reachedThreshold()) return null;

		const target = await ResolvedStarboardMessage.getPostChannel(channel ? (ResolvedChannel.from(channel).id ?? "") : config.channel);
		if (!target || (!channel && this.posted)) return null;
		if (channel) await this.unpost();

		const {embeds, files} = this.generateAttachments();
		const universal = new UniversalMessage(raw).setContent(await this.content()).setEmbeds(...embeds).setFiles(...files);
		const post = await universal.send(target).then((value) => value.last ?? null).catch((e) => {console.error(e); return null;});
		if (post) this.persist({starboard_channel: post.channelId, starboard_message: post.id, starboarded_at: new Date()}, true);
		return post;
	}

	public async edit(): Promise<boolean> {
		const raw = this.message.raw;
		const post = await this.fetchPost();
		if (!raw || !post) return false;

		const {embeds} = this.generateAttachments();
		const universal = new UniversalMessage(raw).setContent(await this.content()).setEmbeds(...embeds).setTarget(post);
		return !!(await universal.editReply().then((value) => value.last).catch(() => null));
	}

	public async unpost(forget = false) {
		await (await this.fetchPost())?.delete().catch(() => null);
		if (forget) this.forget();
		else if (this.dbmessage) this.persist({starboard_channel: null, starboard_message: null, starboarded_at: null}, true);
	}

	public async force(): Promise<Message | null> {
		this.persist({forced: true}, true);
		return this.post();
	}

	private persist(modify: Partial<DBStarboardMessage>, always = false): DBStarboardMessage | undefined {
		const config = this.config;
		const id = this.message.id;
		const raw = this.message.raw;
		const db = this.dbmessage;
		if (!config || !id) return;

		const stars = modify.stars ?? this.stars;
		if (!db && (!raw || (!always && !this.reachedThreshold(stars)))) return;

		const payload = {
			channel: db ? undefined : raw?.channelId,
			author: db ? undefined : raw?.author.id,
			created_at: db ? undefined : raw?.createdAt,
			max_stars: Math.max(stars, db?.max_stars ?? 0),
			updated_at: new Date(),
			...modify
		};

		return SBM.update(config.guild, config.emoji, id, payload);
	}

	public lock(locked = true) {
		return this.persist({locked}, true);
	}

	public forget() {
		const config = this.config;
		const id = this.message.id;
		if (config && id && this.dbmessage) SBM.delete(config.guild, config.emoji, id);
		this.pending_stars = 0;
	}

	// events
	public async onReaction() {
		const id = this.message.id;
		if (!id || !this.reaction || SBM.getByPost(id)) return;

		await this.reaction.resolve();
		await this.message.resolve();
		const raw = this.message.raw;
		const config = this.config;
		const reaction = this.reaction;
		if (!raw || !config?.enabled || this.locked || !reaction.valid()) return;

		if (!this.forced) {
			const filter = config.whitelist;
			if (filter && filter.ids.length > 0) {
				const inList = filter.ids.includes(raw.channelId);
				if (filter.mode === "whitelist" && !inList) return;
				if (filter.mode === "blacklist" && inList) return;
			}
			if (raw.author.bot && !config.allow_bots) return;
		}

		const authorReacted = !!reaction.reaction?.users.cache.has(raw.author.id);
		const stars = Math.max(0, reaction.count - (!config.allow_self && authorReacted ? 1 : 0));
		this.pending_stars = stars;
		this.persist({stars});

		if (!this.posted) await this.post();
		else if (this.reachedDeleteThreshold(stars)) await this.unpost(true);
		else await this.edit();
	}

	public async onDeleted() {
		const guild = this.message.message?.guildId;
		const id = this.message.id;
		if (!guild || !id || SB.getForGuild(guild).length === 0) return;

		for (const row of SBM.getForMessage(guild, id)) {
			const entry = new ResolvedStarboardMessage(this.message, SB.getByEmoji(row.guild, row.emoji));
			if (entry.config?.remove_on_delete) await entry.unpost(true);
		}

		const row = SBM.getByPost(id);
		if (row && SB.getByEmoji(row.guild, row.emoji)?.clear_db_on_delete) SBM.delete(row.guild, row.emoji, row.message);
	}

	public async onEdited() {
		const guild = this.message.message?.guildId;
		const id = this.message.id;
		if (!guild || !id) return;

		const rows = SBM.getForMessage(guild, id).filter((value) => value.starboard_message && SB.getByEmoji(value.guild, value.emoji)?.sync_on_edit);
		if (rows.length === 0) return;

		await this.message.resolve();
		if (!this.message.raw) return;

		for (const row of rows) await new ResolvedStarboardMessage(this.message, SB.getByEmoji(row.guild, row.emoji)).edit();
	}

	// text
	public async content(): Promise<string> {
		return `${await this.starboard.getDisplay()} **${this.stars}** | ${this.message.url ?? ""}`;
	}

	// embeds
	private sortMedia() {
		const images: string[] = [];
		const files: AttachmentBuilder[] = [];
		const oversized: string[] = [];
		const lottie: string[] = [];

		for (const a of this.message.attachments) {
			if (a.contentType?.startsWith("image/")) {
				if (images.length < MAX_IMAGES_IN_EMBED) images.push(a.url);
			} else if (a.size <= MAX_FILE_SIZE && files.length < MAX_FILES) {
				files.push(new AttachmentBuilder(a.url, {name: a.name, description: a.description ?? undefined}));
			} else oversized.push(labeledUrl(a.name, a.url));
		}

		for (const sticker of this.message.stickers) {
			if (sticker.format === StickerFormatType.Lottie) lottie.push(sticker.name);
			else if (images.length < MAX_IMAGES_IN_EMBED) images.push(sticker.url);
		}

		return {images, files, oversized, lottie};
	}

	private mainEmbed(raw: NonNullable<ResolvedMessage["raw"]>, image: string | undefined, lottie: string[], oversized: string[]): EmbedBuilder {
		const author = this.message.author;

		const main = new EmbedBuilder()
			.setAuthor({name: author.getName(), iconURL: author.getAvatarUrl()})
			.setColor(author.getColor(DEFAULT_EMBED_COLOR))
			.setTimestamp(raw.createdAt)
			.setURL(this.message.url ?? null);

		if (this.message.content) main.setDescription(crop(EMBED_DESCRIPTION_LIMIT, this.message.content));
		if (image) main.setImage(image);

		if (raw.reference?.messageId) {
			const {guildId, channelId, messageId} = raw.reference;
			const jump = ResolvedMessage.labeledUrl(guildId ?? raw.guildId ?? "", channelId, messageId, "Jump to message");
			const replied = raw.mentions.repliedUser;
			main.addFields({name: "Replying to", value: `${replied ? `${replied} - ` : ""}${jump}`});
		}

		if (lottie.length) main.addFields({name: "Stickers", value: crop(EMBED_FIELD_VALUE_LIMIT, lottie.join(", "))});
		if (oversized.length) main.addFields({name: "Files too large to copy", value: crop(EMBED_FIELD_VALUE_LIMIT, oversized.join("\n"))});

		return main;
	}
	
	public generateAttachments(): {embeds: EmbedBuilder[]; files: AttachmentBuilder[]} {
		const raw = this.message.raw;
		if (!raw) return {embeds: [], files: []};

		const {images, files, oversized, lottie} = this.sortMedia();

		const embeds = [
			this.mainEmbed(raw, images[0], lottie, oversized),
			...images.slice(1).map((value) => new EmbedBuilder().setURL(this.message.url ?? null).setImage(value))
		];

		for (const embed of this.message.embeds) {
			if (embeds.length >= MAX_EMBEDS) break;
			embeds.push(EmbedBuilder.from(embed));
		}

		return {embeds, files};
	}
}