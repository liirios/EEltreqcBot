import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { isMessage, isSlash, universalReply } from "../../lib/utils";
import { Args } from "@sapphire/framework";
import { prePerm } from "../../lib/perms";
import { Grabber } from "../../lib/helpers/args";
import { ResolvedChannel } from "../../lib/helpers/channels";
import { IOM } from "../../lib/constants";
import { SlashBuilder } from "../../lib/helpers/slash";
import { PermissionFlagsBits } from "discord.js";

const AVAILABLE_GET = ["prefix"];

@ApplyOptions<Subcommand.Options>({
	name: "channel", description: "channel",
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
export class ChannelCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(new SlashBuilder(this)
			.sub("get", "Get info about this channel", (o) => o
				.string("field", true, "Field to take data from", AVAILABLE_GET)
				.quiet())
			.grp("set", "Alter state of this channel", (g) => g
				.sub("prefix", "Set this bot's prefix in current channel", (o) => o
					.string("value")
					.quiet()))
			.builder
		);
	}

	public async getField(iom: IOM, args?: Args) {
		let field = "";
		if (isSlash(iom)) field = iom.options.getString("field", true);
		else if (isMessage(iom) && args) field = await new Grabber(args).pickFrom("string", "field", AVAILABLE_GET, false);
		else return;

		const channel = new ResolvedChannel(iom);

		let content = "";
		switch (field) {
			case "prefix": {content = `This bot's prefix in this channel is ${this.container.client?.user} or \`${channel.getPrefix()}\``; break;}
		}

		await universalReply(iom, content);
	}

	public async setPrefix(iom: IOM, args?: Args) {
		const channel = new ResolvedChannel(iom);
		if (!channel.channel) return universalReply(iom, "You cant use that here");
		const perms = isMessage(iom) ? iom.member?.permissions : iom.memberPermissions;
		if (!perms?.has(PermissionFlagsBits.Administrator)) return universalReply(iom, "You need to be an administrator of this guild");

		let value: string | null | undefined = undefined;
		if (isSlash(iom)) value = iom.options.getString("value");
		else if (isMessage(iom) && args) {
			const grab = new Grabber(args);
			value = await grab.rest("string", "value", "");
			if (value.length === 0) value = null;
		}
		if (value === undefined) return universalReply(iom, "Somewhy the value argument wasnt acquired");

		await channel.setPrefix(value ?? "^"); // TODO: GRAB FROM BOT
		return universalReply(iom, `Channel prefix ${value == null ? "reset" : "changed to \`"+value+"\`"} for ${channel.channel}`);
	}
}