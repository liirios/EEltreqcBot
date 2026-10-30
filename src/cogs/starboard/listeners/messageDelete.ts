import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import type { Message, PartialMessage } from "discord.js";
import { ResolvedStarboardMessage } from "../../../lib/helpers/starboards";

@ApplyOptions<Listener.Options>({event: Events.MessageDelete})
export class MessageDeleteEvent extends Listener<typeof Events.MessageDelete> {
	public override async run(message: Message | PartialMessage) {
		await new ResolvedStarboardMessage(message).onDeleted();
	}
}