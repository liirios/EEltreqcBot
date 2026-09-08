export default {
  data: {
    name: "describe",
    description: "Transcribes Draconic emojis to Text",
    options: [
      { name: "text", description: "Text", type: 3, required: true },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    "integration_types": [0, 1],
    "contexts": [0, 1, 2]
  },
  minPerm: 1,
  async execute(interaction) {
    // await interaction.reply({ content: `> ${CHARACTERS.entriesToText(OLD_CHARACTERS.textToEntriesByDiscord(interaction.options.getString('text')))}`, flags: interaction.options.getBoolean('quiet') ?? false ? MessageFlags.Ephemeral : undefined }).catch(console.error);
      await interaction.reply({ content: `> ${CHARACTERS.entriesToText(CHARACTERS.textToEntriesByAnyText(interaction.options.getString('text')))}`, flags: interaction.options.getBoolean('quiet') ?? false ? 64 : undefined }).catch(console.error);

  }
}