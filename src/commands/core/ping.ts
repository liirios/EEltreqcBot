import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { Message } from "discord.js";
import type { IOM } from "../../lib/constants";
import { universalEditReply, universalReply } from "../../lib/utils";
import { prePerm } from "../../lib/perms";
import { LOC } from "../../lib/helpers/locales";
import { SlashBuilder } from "../../lib/helpers/slash";

@ApplyOptions<Command.Options>({
	name: "ping", description: "pong",
	preconditions: [prePerm(1)]
})
export class PingCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(new SlashBuilder(this).opt((o) => o.quiet()).builder);
	}

	public override async messageRun(message: Message) {return this.sendPing(message);}
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {return this.sendPing(interaction);}

	private async sendPing(iom: IOM) {
		const msg = await universalReply(iom, await LOC.getFormatted("ping.result", {}, iom?.guild?.id))
		if (!msg) return;
		return universalEditReply(iom, msg, await LOC.getFormatted("ping.result.aftermath", {api: String(msg.createdTimestamp - iom.createdTimestamp), bot: String(Math.round(this.container.client.ws.ping))}, iom?.guild?.id));
	}
}
