import { ApplyOptions } from "@sapphire/decorators";
import { Args, Command } from "@sapphire/framework";
import { Message } from "discord.js";
import { prePerm } from "../../../lib/perms";
import { LOC } from "../../../lib/helpers/locales";
import { SlashBuilder } from "../../../lib/helpers/slashes";
import { UniversalMessage } from "../../../lib/helpers/universals";

@ApplyOptions<Command.Options>({
	name: "ping", description: "pong",
	preconditions: [prePerm(1)]
})
export class PingCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(new SlashBuilder(this).opt((o) => o.quiet()).builder);
	}

	public override async messageRun(message: Message, args?: Args) {return this.sendPing(UniversalMessage.from(message, args));}
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {return UniversalMessage.from(interaction);}

	private async sendPing(m: UniversalMessage) {
		await m.reply(await LOC.get("ping.result", {}, ...m.scope));
		if (m.last) await m.editReply(await LOC.get("ping.result.aftermath", {api: String(m.last.createdTimestamp - m.iom.createdTimestamp), bot: String(Math.round(this.container.client.ws.ping))}, ...m.scope));
	}
}