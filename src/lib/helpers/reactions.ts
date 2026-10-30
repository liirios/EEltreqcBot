import { GuildEmoji, MessageReaction, type PartialMessageReaction } from "discord.js";
import { ResolvedEmoji } from "./emojis";
import { ResolvedGuild, type ResolvableGuild } from "./guilds";
import { ResolvedMessage } from "./messages";
import { ResolvedStarboard } from "./starboards";
import { ResolvedUser } from "./users";

export type ResolvableReaction = ResolvedReaction | MessageReaction | PartialMessageReaction | null | undefined;

export class ResolvedReaction {
	public reaction?: MessageReaction | PartialMessageReaction;
	public count: number = 0;
	public users: ResolvedUser[] = [];
	public message: ResolvedMessage;
	public emoji: ResolvedEmoji;
	public guild: ResolvedGuild;

	public constructor(target?: ResolvableReaction, guild?: ResolvableGuild) {
		if (target instanceof ResolvedReaction) {
			this.reaction = target.reaction;
			this.count = target.count;
			this.users = target.users;
			this.message = target.message;
			this.emoji = target.emoji;
			this.guild = target.guild;
		} else if (target == null) {
			this.guild = ResolvedGuild.from(guild);
			this.message = new ResolvedMessage(null);
			this.emoji = new ResolvedEmoji(null, this.guild);
		} else {
			this.reaction = target;
			this.count = target.count ?? 0;
			this.users = [...target.users.cache.values()].map((value) => ResolvedUser.from(value));
			const e = target.emoji;
			const custom = e instanceof GuildEmoji ? e : null;
			this.guild = ResolvedGuild.from(guild ?? custom?.guild ?? target.message?.guild);
			this.message = new ResolvedMessage(target.message);
			this.emoji = new ResolvedEmoji(custom ?? {id: e.id, name: e.name}, this.guild);
		}
	}

	public valid(): boolean {
		return !!this.reaction && this.emoji.valid();
	}

	public resolved(): boolean {
		return !!this.reaction && !this.reaction.partial && this.emoji.resolved();
	}

	// from
	public static from(target?: ResolvableReaction, guild?: ResolvableGuild): ResolvedReaction {
		return target instanceof ResolvedReaction ? target : new ResolvedReaction(target, guild);
	}

	// resolve
	public async resolve(): Promise<this> {
		if (!this.reaction || this.resolved()) return this;
		if (this.reaction.partial) this.reaction = await this.reaction.fetch();
		this.count = this.reaction.count ?? this.count;
		await this.emoji.resolve();
		return this;
	}

	// getters
	public get starboards(): ResolvedStarboard[] {
		return this.emoji.starboards;
	}
}