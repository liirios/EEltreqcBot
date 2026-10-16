import type { Events, MessageCommandErrorPayload } from "@sapphire/framework";
import { Listener, type UserError } from "@sapphire/framework";

export class UserEvent extends Listener<typeof Events.MessageCommandError> {
	public override async run({context, message: content}: UserError, {message}: MessageCommandErrorPayload) {
		if (Reflect.get(Object(context), "silent")) return;

		return message.reply({content, allowedMentions: {users: [message.author.id], roles: []}});
	}
}
