import { setClipboard } from "../clipboard.js";

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

    if (!message.content) {
      return interaction.reply({ content: `> empty message.`, flags: 64 });
    }

    setClipboard(interaction.user.id, message.author.id, message.content);

    await interaction.reply({ content: `> copied.`, flags: 64 });
  }
};