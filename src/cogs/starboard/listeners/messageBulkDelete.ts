import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import type { GuildTextBasedChannel, Message, PartialMessage, ReadonlyCollection } from "discord.js";
import { ResolvedStarboardMessage } from "../../../lib/helpers/starboards";

@ApplyOptions<Listener.Options>({event: Events.MessageBulkDelete})
export class MessageBulkDeleteEvent extends Listener<typeof Events.MessageBulkDelete> {
	public override async run(messages: ReadonlyCollection<string, Message | PartialMessage>, _channel: GuildTextBasedChannel) {
		for (const message of messages.values()) await new ResolvedStarboardMessage(message).onDeleted();
	}
}