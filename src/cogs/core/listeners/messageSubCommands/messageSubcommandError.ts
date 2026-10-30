import { Listener, UserError } from "@sapphire/framework";
import { SubcommandPluginEvents, type MessageSubcommandErrorPayload } from "@sapphire/plugin-subcommands";

export class UserEvent extends Listener<typeof SubcommandPluginEvents.MessageSubcommandError> {
	public override async run(error: unknown, {message}: MessageSubcommandErrorPayload) {
		if (!(error instanceof UserError)) console.error(error);
		else if (Reflect.get(Object(error.context), "silent")) return;

		const content = error instanceof UserError ? error.message : "Something went wrong";
		return message.reply({content, allowedMentions: {users: [message.author.id], roles: []}});
	}
}
