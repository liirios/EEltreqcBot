import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { isMessage, isSlash, universalReply } from "../../lib/utils";
import { Args } from "@sapphire/framework";
import { prePerm } from "../../lib/perms";
import { Grabber } from "../../lib/helpers/args";
import { ResolvedGuild } from "../../lib/helpers/guilds";
import { IOM } from "../../lib/constants";
import { SlashBuilder } from "../../lib/helpers/slash";
import { PermissionFlagsBits } from "discord.js";

const AVAILABLE_GET = ["prefix", "members"];


@ApplyOptions<Subcommand.Options>({
	name: "guild", description: "guild",
	subcommands: [
		{name: "get", chatInputRun: "getField", messageRun: "getField"},
		{
			name: "set", type: "group",
			entries: [
				{name: "prefix", chatInputRun: "setPrefix", messageRun: "setPrefix"}
			]
		}
	],
	preconditions: [prePerm(1)]
})
export class GuildCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(new SlashBuilder(this)
			.sub("get", "Get info about this guild", (o) => o
				.string("field", true, "Field to take data from", AVAILABLE_GET)
				.quiet())
			.grp("set", "Alter state of this guild", (g) => g
				.sub("prefix", "Set this bot's prefix in current guild", (o) => o
					.string("value")
					.quiet()))
			.builder
		);
	}

	public async getField(iom: IOM, args?: Args) {
		let field = ""
		if (isSlash(iom)) field = iom.options.getString("field", true);
		else if (isMessage(iom) && args) field = await new Grabber(args).pickFrom("string", "field", AVAILABLE_GET, false);
		else return;

		const guild = new ResolvedGuild(iom);

		let content = "";
		switch (field) {
			case "prefix": {content = `This bot's default prefix in this server is ${this.container.client?.user} or \`${guild.getPrefix()}\``; break;}
			case "members": {content = `This server's member count is \`${guild.guild?.memberCount}\``; break;}
		}

		await universalReply(iom, content)}

	public async setPrefix(iom: IOM, args?: Args) {
		const guild = new ResolvedGuild(iom);
		if (!guild.guild) return universalReply(iom, "You cant use that here");
		const perms = isMessage(iom) ? iom.member?.permissions : iom.memberPermissions;
		if (!perms?.has(PermissionFlagsBits.Administrator)) return universalReply(iom, "You need to be administrator or owner of this guild");
		
		let value = undefined;
		if (isSlash(iom)) value = iom.options.getString("value")
		else if (isMessage(iom) && args) {
			const grab = new Grabber(args);
			value = await grab.rest("string", "value", "")
			if (value.length === 0) value = null;
		}
		if (value === undefined) return universalReply(iom, "Somewhy the value argument wasnt acquired");
		guild.setPrefix(value ?? "^") // TODO: GRAB FROM BOT
		return universalReply(iom, `Guild prefix ${value == null ? "reset" : "changed to \`"+value+"\`"} for ${guild.guild.name}`);
	}
}