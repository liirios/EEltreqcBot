import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { Args } from "@sapphire/framework";
import { prePerm } from "../../../lib/perms";
import type { IOM } from "../../../lib/constants";
import { UniversalMessage } from "../../../lib/helpers/universals";
import { SlashBuilder } from "../../../lib/helpers/slashes";
import { PRE, Prefixes } from "../../../lib/helpers/prefixes";

const MODIFY_ENTRIES = [
	{name: "global", chatInputRun: "setGlobalPrefix", messageRun: "setGlobalPrefix"},
	{name: "guild", chatInputRun: "setGuildPrefix", messageRun: "setGuildPrefix"},
	{name: "channel", chatInputRun: "setChannelPrefix", messageRun: "setChannelPrefix"}
]

@ApplyOptions<Subcommand.Options>({
	name: "prefix", description: "prefix", aliases: ["prefixes", "prefixs"],
	subcommands: [
		{name: "all", messageRun: "getAvailablePrefixes", default: true},
		{
			name: "get", type: "group",
			entries: [
				{name: "all", chatInputRun: "getAvailablePrefixes", messageRun: "getAvailablePrefixes", default: true},
				{name: "global", chatInputRun: "getGlobalPrefix", messageRun: "getGlobalPrefix"},
				{name: "guild", chatInputRun: "getGuildPrefix", messageRun: "getGuildPrefix"},
				{name: "channel", chatInputRun: "getChannelPrefix", messageRun: "getChannelPrefix"}
			]
		},
		{name: "modify", type: "group", entries: MODIFY_ENTRIES},
		{name: "set", type: "group", entries: MODIFY_ENTRIES},
		{
			name: "reset", type: "group",
			entries: [
				{name: "guild", chatInputRun: "resetGuildPrefix", messageRun: "resetGuildPrefix"},
				{name: "channel", chatInputRun: "resetChannelPrefix", messageRun: "resetChannelPrefix"}
			]
		}
	],
	preconditions: [prePerm(1)]
})
export class PrefixCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(new SlashBuilder(this)
			.grp("get", "Get this bot's prefix from ...", (g) => g
				.sub("all", "Get all of this bot's prefixes in current scope", (o) => o.quiet())
				.sub("global", "Get this bot's global prefix", (o) => o.quiet())
				.sub("guild", "Get this bot's prefix in current guild", (o) => o.quiet())
				.sub("channel", "Get this bot's prefix in current channel", (o) => o.quiet()))
			.grp("modify", "Override this bot's prefix for ...", (g) => g
				.sub("global", "Change this bot's global prefix", (o) => o.string("value", true).quiet())
				.sub("guild", "Override this bot's prefix for current guild", (o) => o.string("value", true).quiet())
				.sub("channel", "Override this bot's prefix for current channel", (o) => o.string("value", true).quiet()))
			.grp("reset", "Reset this bot's prefix to global in ...", (g) => g
				.sub("guild", "Reset this bot's prefix to global in current guild", (o) => o.quiet())
				.sub("channel", "Reset this bot's prefix to global in current channel", (o) => o.quiet()))
			.builder
		);
	}

	public async getAvailablePrefixes(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, undefined, true, true)

		const prefixes = PRE.getAvailable(um.guild, um.channel, true);
		if (Prefixes.isDisabled(prefixes)) return um.reply("Prefix commands are disabled in current scope");

		return um.reply(`This bot's prefixes in current scope are: ${Prefixes.format(prefixes).join(", ")}`);
	}

	public async getGlobalPrefix(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, undefined, true, true)

		return um.reply(`This bot's global prefix is: ${PRE.getGlobal()}\n-# or bot's mention`);
	}

	public async getGuildPrefix(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle()

		const prefix = PRE.getForGuild(um.guild);
		const defaultPrefix = PRE.getGlobal();

		let content = ""
		switch (prefix) {
			case undefined: {content = "This isn't a guild"; break;}
			case null: {content = "Prefix in this guild is disabled\n-# prefix commands wont work here"; break;}
			case "": {content = "Prefix in this guild is unset, any message is treated as a command\n-# or you can use default prefix"; break;}
			case defaultPrefix: {content = `Prefix in this guild is the same as default one (\`${defaultPrefix}\`)\n-# or bot's mention`; break;}
			default: {content = `Prefix in this guild is \`${prefix}\` \n-# or you can use default one`; break;}
		}

		return um.reply(content);
	}

	public async getChannelPrefix(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle()

		const prefix = PRE.getForChannel(um.channel);
		const defaultPrefix = PRE.getGlobal();

		let content = ""
		switch (prefix) {
			case undefined: {content = "Couldn't resolve current channel"; break;}
			case null: {content = "Prefix in this channel is disabled\n-# prefix commands wont work here"; break;}
			case "": {content = "Prefix in this channel is unset, any message is treated as a command\n-# or you can use default prefix"; break;}
			case defaultPrefix: {content = `Prefix in this channel is the same as default one (\`${defaultPrefix}\`)\n-# or bot's mention`; break;}
			default: {content = `Prefix in this channel is \`${prefix}\` \n-# or you can use default one`; break;}
		}

		return um.reply(content);
	}

	public async setGlobalPrefix(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(5, undefined, true, true)

		const value = await um.grab.pick("string", "field")

		const newPrefix = /^(none|null)$/i.test(value) ? null : /^(unset|any)$/i.test(value) ? "" : value
		if (!newPrefix) return um.reply(`Global prefix cannot be set to unset or none`);

		PRE.setGlobal(newPrefix)

		return um.reply(`Global prefix successfully set to \`${newPrefix}\``);
	}

	public async setGuildPrefix(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 5)

		const value = await um.grab.pick("string", "field")

		const newPrefix = /^(none|null)$/i.test(value) ? null : /^(unset|any)$/i.test(value) ? "" : value
		const newPrefixFormatted = newPrefix === null ? "none" : newPrefix === "" ? "unset" : `\`${newPrefix}\``

		PRE.setForGuild(newPrefix, um.guild)

		return um.reply(`Guild prefix successfully set to ${newPrefixFormatted}`);
	}

	public async setChannelPrefix(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 5)

		const value = await um.grab.pick("string", "field")

		const newPrefix = /^(none|null)$/i.test(value) ? null : /^(unset|any)$/i.test(value) ? "" : value
		const newPrefixFormatted = newPrefix === null ? "none" : newPrefix === "" ? "unset" : `\`${newPrefix}\``

		PRE.setForChannel(newPrefix, um.channel)

		return um.reply(`Channel prefix successfully set to ${newPrefixFormatted}`);
	}

	public async resetGuildPrefix(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 5)

		PRE.resetForGuild(um.guild)

		return um.reply(`Channel prefix successfully reset`);
	}

	public async resetChannelPrefix(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 5)

		PRE.resetForChannel(um.channel)

		return um.reply(`Channel prefix successfully reset`);
	}
}