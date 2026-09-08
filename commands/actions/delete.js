import { InteractionResponse } from "../../enum.js";

export default {
  data: {
    name: "Delete bot's message",
    type: 3,
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 3,
  async execute(interaction) {
    const message = interaction.targetMessage;

    if (message.author.id !== interaction.client.user.id) return InteractionResponse.CUSTOM("non eltreqc message")

    await message.delete();
    await interaction.reply({ content: `> deleted.`, flags: 64 });
    return InteractionResponse.OK;
  }
};