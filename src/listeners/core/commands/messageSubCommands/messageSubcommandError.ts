import { Listener, type UserError } from "@sapphire/framework";
import { SubcommandPluginEvents, type MessageSubcommandErrorPayload } from "@sapphire/plugin-subcommands";

export class UserEvent extends Listener<typeof SubcommandPluginEvents.MessageSubcommandError> {
	public override async run({context, message: content}: UserError, {message}: MessageSubcommandErrorPayload) {
		if (Reflect.get(Object(context), "silent")) return;

		return message.reply({content, allowedMentions: {users: [message.author.id], roles: []}});
	}
}
