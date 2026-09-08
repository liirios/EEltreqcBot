import { reply } from "../../bot.js";
import { InteractionResponse } from "../../enum.js";

export default {
  data: {
    type: 3,
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 1,
  async execute(interaction) {
    const message = interaction.targetMessage;

    if (!message.content) return InteractionResponse.CUSTOM("empty message");

    await reply(interaction, "describe.result", {value: CHARACTERS.entriesToText(CHARACTERS.textToEntriesByAnyText(message.content))}, true);
    return InteractionResponse.OK;
  }
};