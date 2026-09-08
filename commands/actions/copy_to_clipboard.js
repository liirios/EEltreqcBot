import { setClipboard } from "../../clipboard.js";
import { InteractionResponse } from "../../enum.js";

export default {
  data: {
    name: "Copy to Clipboard",
    type: 3,
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 3,
  async execute(interaction) {
    const message = interaction.targetMessage;

    if (!message.content) return InteractionResponse.CUSTOM("empty message");

    setClipboard(interaction.user.id, message.author.id, message.content);

    await interaction.reply({ content: `> copied.`, flags: 64 });
    return InteractionResponse.OK;
  }
};