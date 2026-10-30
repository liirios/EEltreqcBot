import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import type { Message, PartialMessage } from "discord.js";
import { ResolvedStarboardMessage } from "../../../lib/helpers/starboards";

@ApplyOptions<Listener.Options>({event: Events.MessageUpdate})
export class MessageUpdateEvent extends Listener<typeof Events.MessageUpdate> {
	public override async run(_old: Message | PartialMessage, updated: Message | PartialMessage) {
		await new ResolvedStarboardMessage(updated).onEdited();
	}
}