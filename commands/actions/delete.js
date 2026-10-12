import {Option, Result, Setting} from "../../enum.js";

export default {
  data: {
    name: "Delete bot's message",
    type: 3,
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  settings: [Setting.PERM(3, false)],
  async execute(interaction) {
    const message = interaction.targetMessage;

    if (message.author.id !== interaction.client.user.id) return Result.CUSTOM("non eltreqc message")

    await message.delete();
    await interaction.reply({content: `> deleted.`, flags: 64});
    return Result.OK;
  }
};