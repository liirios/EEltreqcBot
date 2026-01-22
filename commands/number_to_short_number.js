module.exports = {
  data: {
    name: "number_to_short_number",
    description: "Converts number to Draconic short number text",
    options: [
      { name: "number", description: "Number", type: 4, required: true },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    "integration_types": [0, 1],
    "contexts": [0, 1, 2]
  },
  async execute(interaction) {
    await interaction.reply({ content: `> ${NUMBERS.numberToTextShort(interaction.options.getInteger('number'))}`, flags: interaction.options.getBoolean('quiet') ?? false ? MessageFlags.Ephemeral : undefined }).catch(console.error);
  }
}