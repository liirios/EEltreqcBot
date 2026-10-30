import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { Args } from "@sapphire/framework";
import type { IOM } from "../../../lib/constants";
import { prePerm } from "../../../lib/perms";
import { SlashBuilder } from "../../../lib/helpers/slashes";
import { UniversalMessage } from "../../../lib/helpers/universals";
import { ResolvedStarboard, ResolvedStarboardMessage, SB, SBM } from "../../../lib/helpers/starboards";
import { ResolvedEmoji } from "../../../lib/helpers/emojis";
import { ResolvedChannel } from "../../../lib/helpers/channels";
import { ResolvedMessage } from "../../../lib/helpers/messages";

const OPTIONS = ["style", "emoji", "channel", "threshold", "delete_threshold", "allow_self", "allow_bots", "sync_on_edit", "remove_on_delete", "clear_db_on_delete", "enabled"];
const ALL_STYLES = ["entries"]
const DEFAULT_ALL_STYLE = ALL_STYLES[0];
const GET_STYLES = ["short", "full", 
	// "shortEmbed", "fullEmbed"
]
const DEFAULT_GET_STYLE = GET_STYLES[0];

const ENTRY = [
	{name: "all", chatInputRun: "entryGetAll", messageRun: "entryGetAll", default: true},
	{name: "get", chatInputRun: "entryGet", messageRun: "entryGet"},
	{name: "add", chatInputRun: "entryAddNew", messageRun: "entryAddNew"},
	{name: "modify", chatInputRun: "entryModify", messageRun: "entryModify"},
	{name: "remove", chatInputRun: "entryRemove", messageRun: "entryRemove"}
]
const WHITELIST = [
	{name: "get", chatInputRun: "whitelistGet", messageRun: "whitelistGet"},
	{name: "add", chatInputRun: "whitelistAdd", messageRun: "whitelistAdd"},
	{name: "remove", chatInputRun: "whitelistRemove", messageRun: "whitelistRemove"},
	{name: "blacklist", chatInputRun: "whitelistBlacklist", messageRun: "whitelistBlacklist"}
]

@ApplyOptions<Subcommand.Options>({
	name: "starboard", description: "starboard", aliases: ["starboards", "starsboard", "starsboards", "star", "stars"],
	options: OPTIONS,
	subcommands: [
		{name: "all", messageRun: "entryGetAll", default: true},
		{name: "entry", type: "group", entries: ENTRY},
		{name: "entries", type: "group", entries: ENTRY},
		{name: "whitelist", type: "group", entries: WHITELIST},
		{name: "whitelists", type: "group", entries: WHITELIST},
		{name: "blacklist", type: "group", entries: WHITELIST},
		{name: "blacklists", type: "group", entries: WHITELIST},
		{
			name: "message", type: "group",
			entries: [
				{name: "lock", chatInputRun: "messageLock", messageRun: "messageLock"},
				{name: "force", chatInputRun: "messageForceStar", messageRun: "messageForceStar"}
			]
		},
		{name: "force", chatInputRun: "messageForceStar", messageRun: "messageForceStar"}
	],
	preconditions: [prePerm(1)]
})
export class StarboardCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(new SlashBuilder(this)
			.grp("entry", "Starboard entries for current guild", (g) => g
				.sub("all", "Get info about all starboards in this guild", (o) => o.string("style", false, undefined, ALL_STYLES).quiet())
				.sub("get", "Get info about specific starboard in this guild by id", (o) => o.integer("id", true).string("style", false, undefined, GET_STYLES).quiet())
				.sub("add", "Add new starboard in current guild", (o) => o
					.string("emoji", true).channel("channel", true)
					.integer("threshold").integer("delete_threshold")
					.boolean("allow_self").boolean("allow_bots").boolean("sync_on_edit").boolean("remove_on_delete").boolean("clear_db_on_delete").boolean("enabled")
					.quiet())
				.sub("modify", "Modify starboard in current guild", (o) => 
					o.integer("id", true).string("emoji").channel("channel").integer("threshold").integer("delete_threshold")
					.boolean("allow_self").boolean("allow_bots").boolean("sync_on_edit").boolean("remove_on_delete").boolean("clear_db_on_delete").boolean("enabled")
					.quiet())
				.sub("remove", "Remove starboard from current guild", (o) => o.integer("id", true).quiet()))
			.grp("whitelist", "Channel whitelist (or blacklist) for a starboard", (g) => g
				.sub("get", "Get starboard's whitelisted channels", (o) => o.integer("id", true).quiet())
				.sub("add", "Add a channel to the whitelist", (o) => o.integer("id", true).channel("channel", true).quiet())
				.sub("remove", "Remove a channel from the whitelist", (o) => o.integer("id", true).channel("channel", true).quiet())
				.sub("blacklist", "Treat starboard's whitelist as blacklist", (o) => o.integer("id", true).boolean("blacklist", true).quiet()))
			.grp("message", "Control starboard messages idk im out of description ideas", (g) => g
				.sub("lock", "Lock (or unlock) a message in every starboard of this guild", (o) => o.integer("id", true).string("message", true).boolean("locked").quiet())
				.sub("force", "Force a message onto a starboard regardless of stars", (o) => o.integer("id", true).string("message", true).quiet()))
			.builder
		);
	}

	private async pickStarboard(um: UniversalMessage): Promise<[number, ResolvedStarboard | undefined]> {
		const id = await um.grab.pick("integer", "id");
		return [id, um.guild.starboards.find((value) => value.dbstarboard?.id === String(id))];
	}

	private async pickMessage(um: UniversalMessage): Promise<ResolvedMessage | null> {
		const input = (await um.grab.pick("string", "message")).trim();
		const link = input.match(/channels\/(\d+)\/(\d+)\/(\d+)/);
		const [guildId, channelId, messageId] = link ? link.slice(1) : [um.guild.id, um.channel.id, /^\d{17,20}$/.test(input) ? input : undefined];

		if (guildId === um.guild.id && messageId) {
			const post = SBM.getByPost(messageId);
			const message = await this.fetchMessage(post?.channel ?? channelId, post?.message ?? messageId);
			if (message) return ResolvedMessage.from(message);
		}
		await um.reply("Message not found");
		return null;
	}

	private async fetchMessage(channelId?: string, messageId?: string) {
		const channel = (await ResolvedChannel.from(channelId).resolve()).channel;
		return channel?.isTextBased() ? await channel.messages.fetch(messageId!).catch(() => null) : null;
	}

	public async entryGetAll(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 4)

		const list = um.guild.starboards;
		if (!list.length) return um.reply("There is no starboards in this guild");

		const style = await um.grab.pickFromList("string", "style", ALL_STYLES, false, DEFAULT_ALL_STYLE);
		switch (style) {
			case "entries": return um.reply([`Available starboards at ${um.guild.getName()}:`, ...await Promise.all(list.map((value) => value.entry()))].join("\n"));
			default: return;
		}
	}

	public async entryGet(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 4)
		
		const [, starboard] = await this.pickStarboard(um);
		if (!starboard || !starboard.valid()) return um.reply("Starboard not found");

		const style = await um.grab.pickFromList("string", "style", GET_STYLES, false, DEFAULT_GET_STYLE);
		switch (style) {
			case "full": return um.reply(await starboard.full());
			case "short": default: return um.reply(await starboard.short());
		}
	}

	public async entryAddNew(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 4)

		const emoji = await ResolvedEmoji.from(await um.grab.pick("emoji", "emoji")).resolve();
		if (!emoji.valid()) return um.reply("Invalid emoji");
		if (um.guild.starboards.some((value) => value.matches(emoji))) return um.reply("There is already a starboard with that emoji in this guild");

		const channel = await ResolvedChannel.from(await um.grab.pick("channel", "channel")).resolve()
		if (!channel.valid()) return um.reply("Invalid channel");
		if (!channel.isSendable()) return um.reply("Unsendable channel");

		const threshold = (await um.grab.option("integer", "threshold", null)) ?? undefined
		if (threshold && threshold <= 0) return um.reply("Threshold cannot be 0 or less");

		const delete_threshold = (await um.grab.option("integer", "delete_threshold", null)) ?? undefined
		if (delete_threshold && delete_threshold < 0) return um.reply("Deletion threshold cannot be less than 0");
		if (delete_threshold && delete_threshold > (threshold ?? 3)) return um.reply(`Deletion threshold cannot be less or equal to threshold (${(threshold ?? 3)})`);

		const payload = {
			channel: channel.id,
			threshold: threshold,
			delete_threshold: delete_threshold,
			allow_self: (await um.grab.option("boolean", "allow_self", null)) ?? undefined,
			allow_bots: (await um.grab.option("boolean", "allow_bots", null)) ?? undefined,
			sync_on_edit: (await um.grab.option("boolean", "sync_on_edit", null)) ?? undefined,
			remove_on_delete: (await um.grab.option("boolean", "remove_on_delete", null)) ?? undefined,
			clear_db_on_delete: (await um.grab.option("boolean", "clear_db_on_delete", null)) ?? undefined,
			enabled: (await um.grab.option("boolean", "enabled", null)) ?? undefined,
			origin: {by: um.author.id ?? null, at: Date.now()}
		}

		const row = SB.update(um.guild.id!, emoji.id!, payload);
		return um.reply(await ResolvedStarboard.from(row, um.guild).full());
	}

	public async entryModify(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 4)

		const [_id, starboard] = await this.pickStarboard(um);
		if (!starboard || !starboard.valid()) return um.reply("Starboard not found");
		const before = {...starboard.dbstarboard!};

		const raw_emoji = (await um.grab.option("emoji", "emoji", null)) ?? undefined;
		const emoji = raw_emoji ? await ResolvedEmoji.from(raw_emoji).resolve() : undefined;
		if (emoji && !emoji.valid()) return um.reply("Invalid emoji");
		const emojiChanged = !!emoji && emoji.id !== before.emoji;
		if (emojiChanged && um.guild.starboards.some((value) => value.matches(emoji))) return um.reply("There is already another starboard with that emoji in this guild");

		const raw_channel = (await um.grab.option("channel", "channel", null)) ?? undefined;
		const channel = raw_channel ? await ResolvedChannel.from(raw_channel).resolve() : undefined;
		if (channel && !channel.valid()) return um.reply("Invalid channel");
		if (channel && !channel.isSendable()) return um.reply("Unsendable channel");

		const threshold = (await um.grab.option("integer", "threshold", null)) ?? undefined;
		if (threshold !== undefined && threshold <= 0) return um.reply("Threshold cannot be 0 or less");

		const delete_threshold = (await um.grab.option("integer", "delete_threshold", null)) ?? undefined;
		if (delete_threshold && delete_threshold < 0) return um.reply("Deletion threshold cannot be less than 0");
		if (delete_threshold && delete_threshold > (threshold ?? before.threshold)) return um.reply(`Deletion threshold must be lower or equal to current threshold (${threshold ?? before.threshold})`);

		const payload = {
			channel: channel?.id ?? undefined,
			threshold,
			delete_threshold,
			allow_self: (await um.grab.option("boolean", "allow_self", null)) ?? undefined,
			allow_bots: (await um.grab.option("boolean", "allow_bots", null)) ?? undefined,
			sync_on_edit: (await um.grab.option("boolean", "sync_on_edit", null)) ?? undefined,
			remove_on_delete: (await um.grab.option("boolean", "remove_on_delete", null)) ?? undefined,
			clear_db_on_delete: (await um.grab.option("boolean", "clear_db_on_delete", null)) ?? undefined,
			enabled: (await um.grab.option("boolean", "enabled", null)) ?? undefined,
		};

		const changes = starboard.changesFrom(payload);
		const unchanged = Object.keys(changes).length === 0;
		if (!emojiChanged && unchanged) return um.reply(`Nothing to modify\n-# give options like --allow_self=false\n-# allowed options: ${OPTIONS.join(", ")}`);

		let key = before.emoji;
		if (emojiChanged) {
			key = emoji!.id!;
			SB.setEmoji(before.guild, before.emoji, key);
			SBM.rekey(before.guild, before.emoji, key);
		}
		if (!unchanged) SB.update(before.guild, key, changes);

		const updated = ResolvedStarboard.from(SB.get(before.guild, key), um.guild);
		const applied = emojiChanged ? {emoji: key, ...changes} : changes;
		return um.reply(updated.formatChanges(before, applied));
	}

	public async entryRemove(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 4)
		
		const [_id, starboard] = await this.pickStarboard(um);
		if (!starboard || !starboard.valid()) return um.reply("Starboard not found");

		SBM.clear(um.guild.id!, starboard.dbstarboard!.emoji);
		SB.delete(um.guild.id!, starboard.dbstarboard!.emoji);

		return um.reply(`Removed ${starboard.label} from ${um.guild.getName()}`);
	}

	public async whitelistGet(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 4)
		
		const [_id, starboard] = await this.pickStarboard(um);
		if (!starboard || !starboard.valid()) return um.reply("Starboard not found");

		const filter = starboard.filter;
		const header = `${starboard.label} ${filter.mode}:`;
		if (!filter.ids.length) return um.reply(`${header}\n-# empty, every channel counts`); // TODO: move to resolved starboard
		return um.reply([header, ...filter.ids.map((value) => `- ${ResolvedChannel.mention(value)}`)].join("\n"));
	}

	public async whitelistAdd(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 4)

		const [_id, starboard] = await this.pickStarboard(um);
		if (!starboard || !starboard.valid()) return um.reply("Starboard not found");

		const channel = ResolvedChannel.from(await um.grab.pick("channel", "channel"));
		const filter = starboard.filter;
		if (filter.ids.includes(channel.id!)) return um.reply(`${channel.mention} is already in the ${filter.mode}`);

		starboard.setFilter({...filter, ids: [...filter.ids, channel.id!]});
		return um.reply(`Added ${channel.mention} to the ${filter.mode} of ${starboard.label}`);
	}

	public async whitelistRemove(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 4)
		
		const [, starboard] = await this.pickStarboard(um);
		if (!starboard || !starboard.valid()) return um.reply("Starboard not found");

		const channel = ResolvedChannel.from(await um.grab.pick("channel", "channel"));
		const filter = starboard.filter;
		if (!filter.ids.includes(channel.id!)) return um.reply(`${channel.mention} is not in the ${filter.mode}`);

		const ids = filter.ids.filter((value) => value !== channel.id);
		starboard.setFilter({...filter, ids});

		return um.reply(`Removed ${channel.mention} from the ${filter.mode} of ${starboard.label}`);
	}

	public async whitelistBlacklist(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 4)

		const [_id, starboard] = await this.pickStarboard(um);
		if (!starboard || !starboard.valid()) return um.reply("Starboard not found");

		const mode = (await um.grab.pick("boolean", "blacklist")) ? "blacklist" : "whitelist";

		const filter = starboard.filter;
		if (filter.mode === mode) return um.reply(`Whitelist of ${starboard.label} already acts as ${mode}`);

		starboard.setFilter({...filter, mode});
		return um.reply(`Whitelist of ${starboard.label} now acts as ${mode}`);
	}

	public async messageLock(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 4)
		
		const [_id, starboard] = await this.pickStarboard(um);
		if (!starboard || !starboard.valid()) return um.reply("Starboard not found");

		const message = await this.pickMessage(um);
		if (!message) return;

		const locked = await um.grab.pick("boolean", "locked", true);
		const entry = new ResolvedStarboardMessage(message, starboard);
		if (entry.locked === locked) return um.reply(`That message is already ${locked ? "locked" : "unlocked"} on ${starboard.label}`);

		entry.lock(locked);
		return um.reply(`${locked ? "Locked" : "Unlocked"} message ${message.url} on ${starboard.label}`);
	}

	public async messageForceStar(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 4)
		
		const [_id, starboard] = await this.pickStarboard(um);
		if (!starboard || !starboard.valid()) return um.reply("Starboard not found");

		const message = await this.pickMessage(um);
		if (!message) return;

		const entry = new ResolvedStarboardMessage(message, starboard);
		if (entry.posted) return um.reply("That message is already starboarded");
		if (entry.locked) return um.reply("That message is locked");

		const post = await entry.force();
		if (!post) return um.reply("Couldn't post it\n-# mayhaps i cannot send messages in the starboard channel idk");
		return um.reply(`Forced onto ${starboard.label}: ${post.url}`);
	}
}