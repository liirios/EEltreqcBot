module.exports = {
  data: {
    name: "transcribe",
    description: "Transcribes text to Draconic emojis",
    options: [
      { name: "text", description: "Text", type: 3, required: true },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    "integration_types": [0, 1],
    "contexts": [0, 1, 2]
  },
  async execute(interaction) {
    await interaction.reply({ content: `> ${CHARACTERS.entriesToDiscord(CHARACTERS.textToEntriesByAnyText(interaction.options.getString('text')))}`, flags: interaction.options.getBoolean('quiet') ?? false ? MessageFlags.Ephemeral : undefined }).catch(console.error);
  }
}