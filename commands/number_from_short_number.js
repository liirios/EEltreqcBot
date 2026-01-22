module.exports = {
  data: {
    name: "number_from_short_number",
    description: "Converts Draconic short number text to number",
    options: [
      { name: "text", description: "Text", type: 3, required: true },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    "integration_types": [0, 1],
    "contexts": [0, 1, 2]
  },
  async execute(interaction) {
    await interaction.reply({ content: `> ${NUMBERS.textToNumberShort(interaction.options.getString('text'))}`, flags: interaction.options.getBoolean('quiet') ?? false ? MessageFlags.Ephemeral : undefined }).catch(console.error);
  }
}