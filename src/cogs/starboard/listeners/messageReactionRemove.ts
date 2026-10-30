import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import type { MessageReaction, PartialMessageReaction } from "discord.js";
import { ResolvedStarboardMessage } from "../../../lib/helpers/starboards";

@ApplyOptions<Listener.Options>({event: Events.MessageReactionRemove})
export class MessageReactionRemoveEvent extends Listener<typeof Events.MessageReactionRemove> {
	public override async run(reaction: MessageReaction | PartialMessageReaction) {
		await ResolvedStarboardMessage.fromMessageAndReaction(reaction.message, reaction)?.onReaction();
	}
}