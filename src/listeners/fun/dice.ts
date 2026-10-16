import { Events, Listener } from "@sapphire/framework";
import type { Message } from "discord.js";

function parseDice(input: string) {
	const m = input.match(/^(\d+)?d(\d+)((?:[+-]\d+)*)$/i);
	if (!m) return null;
	return {
		mult: m[1] ? parseInt(m[1]) : 1,
		chips: parseInt(m[2]),
		bonuses: (m[3].match(/[+-]\d+/g) ?? []).map(Number)
	};
}

export class DiceEvent extends Listener<typeof Events.MessageCreate> {
	public constructor(context: Listener.LoaderContext) {
		super(context, {event: Events.MessageCreate});
	}

	public override run(message: Message) {
		if (message.author.bot || !message.channel.isSendable()) return;

		const prefixes = ["^", `<@${this.container.client.user?.id}>`];
		const used = prefixes.find((p) => message.content.startsWith(p));
		if (!used) return;

		const dice = parseDice(message.content.slice(used.length)
			.replace("roll a", "").replace("roll", "")
			.replace("please", "").replace("pls", "").replace("plz", "")
			.replace("thanks", "").replace("thank", "").replace("thx", "")
			.trim().split(/\s+/)[0]);
		if (!dice) return;
		if (dice.chips < 0 || dice.mult < 0) return;

		const times = Math.min(dice.mult, 100);
		const bonus = dice.bonuses.reduce((a, b) => a + b, 0);
		let total = 0;
		for (let i = 0; i < times; i++) total += Math.min(dice.chips, Math.max(1, Math.floor(Math.random() * dice.chips) + 1 + bonus));

		return message.channel.send(total.toString());
	}
}