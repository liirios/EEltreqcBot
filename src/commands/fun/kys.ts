import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { Message } from "discord.js";

@ApplyOptions<Command.Options>({
	name: "kys",
	description: "kys",
	aliases: ["explode"]
})
export class KysCommand extends Command {
	public override async messageRun(message: Message) {
		if (message?.channel.isSendable()) await message.reply("nuhuh")
	}
}
