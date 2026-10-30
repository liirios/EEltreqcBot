import type { Events } from "@sapphire/framework";
import { Listener } from "@sapphire/framework";
import type { Message } from "discord.js";
import { PRE, Prefixes } from "../../../lib/helpers/prefixes";

export class UserEvent extends Listener<typeof Events.MentionPrefixOnly> {
	public override run(message: Message) {
		if (!message.channel.isSendable()) return;
		const prefixes = PRE.getAvailable(message, message);
		if (Prefixes.isDisabled(prefixes)) return;
		return message.channel.send(Prefixes.format(prefixes).join(", "));
	}
}