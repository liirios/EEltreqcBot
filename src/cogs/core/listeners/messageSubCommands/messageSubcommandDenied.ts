import { Listener, type UserError } from "@sapphire/framework";
import { SubcommandPluginEvents, type MessageSubcommandDeniedPayload } from "@sapphire/plugin-subcommands";

export class UserEvent extends Listener<typeof SubcommandPluginEvents.MessageSubcommandDenied> {
	public override async run({context, message: content}: UserError, {message}: MessageSubcommandDeniedPayload) {
		if (Reflect.get(Object(context), "silent")) return;

		return message.reply({content, allowedMentions: {users: [message.author.id], roles: []}});
	}
}
