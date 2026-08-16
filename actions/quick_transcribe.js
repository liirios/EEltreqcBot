import { entriesToDiscord } from "../draconic.js";

export default {
  data: {
    name: "Quick Transcribe",
    type: 3,
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 1,
  async execute(interaction) {
    const message = interaction.targetMessage;

    if (!message.content) {
      return interaction.reply({ content: `> empty message.`, flags: 64 });
    }

    await interaction.reply({ content: `> ${entriesToDiscord(CHARACTERS.textToEntriesByAnyText(message.content))}`, flags: 64 });
  }
};