import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { Message } from "discord.js";
import { AUTHOR_ID } from "../../lib/config";

@ApplyOptions<Command.Options>({
	name: "sudo",
	description: "sudo"
})
export class SudoCommand extends Command {
	public override async messageRun(message: Message) {
		if (message?.channel.isSendable()) await message.reply(message.author.id === AUTHOR_ID ? "okay" : `${message.author.username} is not in the sudoers file. This incident will be reported.`)
	}
}
