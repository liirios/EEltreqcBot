import type { Events } from "@sapphire/framework";
import { Listener } from "@sapphire/framework";
import type { Message } from "discord.js";
import { ResolvedGuild } from "../lib/helpers/guilds";
import { ResolvedChannel } from "../lib/helpers/channels";

export class UserEvent extends Listener<typeof Events.MentionPrefixOnly> {
	public override run(message: Message) {
		if (!message.channel.isSendable()) return;
		const prefixes = new Set();
		prefixes.add(`${this.container.client.user}`);
		prefixes.add(`\`${this.container.client.options.defaultPrefix}\``);
		prefixes.add(`\`${new ResolvedGuild(message).getPrefix()}\``);
		prefixes.add(`\`${new ResolvedChannel(message).getPrefix()}\``);
		
		return message.channel.send(Array.from(prefixes).join(", "));
	}
}
