import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { Args } from "@sapphire/framework";
import type { IOM } from "../../../lib/constants";
import { prePerm } from "../../../lib/perms";
import { SlashBuilder } from "../../../lib/helpers/slashes";
import { UniversalMessage } from "../../../lib/helpers/universals";
import { GuildBasedChannel, PermissionFlagsBits } from "discord.js";
import { isGuildBasedChannel } from "@sapphire/discord.js-utilities";
import { AUTHOR_ID } from "../../../lib/config";
import { formatChanges } from "../../../lib/string";

const OPTIONS = ["style", "force"];
const FLAGS = ["force"];

const GET_STYLES = ["short", "full", "shortEmbed", "fullEmbed"];
const DEFAULT_GET_STYLE = GET_STYLES[0];

const BOT_MODIFY_FIELDS = ["perm"];
const GUILD_MODIFY_FIELDS = ["nickname"];
const MODIFY_FIELDS = [...BOT_MODIFY_FIELDS, ...GUILD_MODIFY_FIELDS];

@ApplyOptions<Subcommand.Options>({
	name: "user", description: "user", aliases: ["users"],
	options: [...OPTIONS, ...MODIFY_FIELDS, "global"], flags: FLAGS,
	subcommands: [
		{name: "get", chatInputRun: "userGet", messageRun: "userGet"},
		{name: "modify", chatInputRun: "userModify", messageRun: "userModify"},
		{name: "set", chatInputRun: "userModify", messageRun: "userModify"}
	],
	preconditions: [prePerm(1)]
})
export class UserCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(new SlashBuilder(this)
			.sub("get", "Get info about a user", (o) => o.target().string("style", false, undefined, GET_STYLES).boolean("force").quiet())
			.sub("modify", "Modify info about a user", (o) => o.target().integer("perm", false, "Perm level (in this guild)").string("nickname", false, "Nickname in this guild").boolean("global", false, "Set global perm and refuse guild options").quiet())
			.builder
		);
	}

	public async userGet(iom: IOM, args?: Args) {
		const um = await UniversalMessage.fromDeferred(iom, args)

		const target = await um.pickUser();
		const style = await um.grab.optionFromList("string", "style", GET_STYLES, false, DEFAULT_GET_STYLE);
		const force = await um.grab.optionOrFlag("force");

		const user = await target.resolve(um.guild.guild, force);
		if (!user.user) return um.reply("Couldn't find that user");

		switch (style) {
			case "full": return um.reply(user.full());
			case "shortEmbed": return um.setContent("").setEmbeds(user.shortEmbed()).reply();
			case "fullEmbed": return um.setContent("").setEmbeds(user.fullEmbed()).reply();
			case "short": default: return um.reply(user.short());
		}
	}

	public async userModify(iom: IOM, args?: Args) {
		const um = await UniversalMessage.fromDeferred(iom, args)

		const target = await um.pickUser();
		await target.resolve(um.guild.guild);

		const global = await um.grab.option("boolean", "global", false);
		if (!global && !um.guild.valid()) return um.reply("Cant use that here\n-# --global=true for global");

		const raw_nickname = (await um.grab.option("string", "nickname", null)) ?? undefined;
		const payload = {
			perm: (await um.grab.option("integer", "perm", null)) ?? undefined,
			nickname: raw_nickname === undefined ? undefined : raw_nickname.trim() || null,
		};

		if (global && payload.nickname !== undefined) return um.reply(`Cant use guild options with global\n-# guild options: ${GUILD_MODIFY_FIELDS.join(", ")}`);

		const scope = global ? undefined : um.guild;
		const current: Record<string, unknown> = {perm: target.getPerm(scope), nickname: target.member?.nickname ?? null};
		const changes = Object.fromEntries(Object.entries(payload).filter(([key, value]) => value !== undefined && value !== current[key]));
		const keys = Object.keys(changes);
		if (!keys.length) return um.reply(`Nothing to modify\n-# allowed options: ${MODIFY_FIELDS.join(", ")}`);

		const channel = um.channel.channel;
		if ("nickname" in changes && !isGuildBasedChannel(channel)) return um.reply("Cant use that here");

		for (const key of keys) {
			switch (key) {
				case "perm": {
					um.author.requirePerm(5, scope);
					if (payload.perm! < 0) return um.reply("Perm cannot be less than 0");
					let perm = um.author.getPerm(scope);
					if (payload.perm! >= perm && um.author.id !== AUTHOR_ID) return um.reply(`Perm cannot more or equal to your perm (${perm}))`);
					if (!target.setPerm(payload.perm!, scope)) return um.reply("Couldn't set perm");
					break;
				}
				case "nickname": {
					if (!target.member) return um.reply("That user isn't in this guild");
					um.author.requirePerm(3, um.guild);
					(await um.self.resolve(um.guild.guild)).requireDiscordPerms(channel as GuildBasedChannel, PermissionFlagsBits.ManageNicknames);
					await target.member.setNickname(payload.nickname!);
					break;
				}
			}
		}

		return um.reply(formatChanges(`${target.user} updated ${global ? "globally" : `at ${um.guild.getName()}`}:`, current, changes));
	}
}