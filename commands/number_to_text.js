module.exports = {
  data: {
    name: "number_to_text",
    description: "Converts number to Draconic text",
    options: [
      { name: "number", description: "Number", type: 4, required: true },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    "integration_types": [0, 1],
    "contexts": [0, 1, 2]
  },
  async execute(interaction) {
    await interaction.reply({ content: `> ${NUMBERS.numberToText(interaction.options.getInteger('number'))}`, flags: interaction.options.getBoolean('quiet') ?? false ? MessageFlags.Ephemeral : undefined }).catch(console.error);
  }
}