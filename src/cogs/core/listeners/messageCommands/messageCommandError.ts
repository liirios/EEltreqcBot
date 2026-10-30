import type { Events, MessageCommandErrorPayload } from "@sapphire/framework";
import { Listener, UserError } from "@sapphire/framework";

export class UserEvent extends Listener<typeof Events.MessageCommandError> {
	public override async run(error: unknown, {message}: MessageCommandErrorPayload) {
		if (!(error instanceof UserError)) console.error(error);
		else if (Reflect.get(Object(error.context), "silent")) return;

		const content = error instanceof UserError ? error.message : "Something went wrong";
		return message.reply({content, allowedMentions: {users: [message.author.id], roles: []}});
	}
}
