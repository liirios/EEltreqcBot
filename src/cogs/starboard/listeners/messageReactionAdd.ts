import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import type { MessageReaction, PartialMessageReaction } from "discord.js";
import { ResolvedStarboardMessage } from "../../../lib/helpers/starboards";

@ApplyOptions<Listener.Options>({event: Events.MessageReactionAdd})
export class MessageReactionAddEvent extends Listener<typeof Events.MessageReactionAdd> {
	public override async run(reaction: MessageReaction | PartialMessageReaction) {
		await ResolvedStarboardMessage.fromMessageAndReaction(reaction.message, reaction)?.onReaction();
	}
}