export default {
  data: {
    name: "1uetranscribe",
    description: "Transcribes text to Draconic emojis",
    options: [
      { name: "text", description: "Text", type: 3, required: true },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    "integration_types": [0, 1],
    "contexts": [0, 1, 2]
  },
  minPerm: 4,
  async execute(interaction) {
    const text = interaction.options.getString("text");
    const lines = text.split(",").map(segment =>
      CHARACTERS.entriesToDiscord(CHARACTERS.textToEntriesByAnyText(segment.trim()))
    );
    const content = lines.map(line => `> ${line}`).join("\n");
    await interaction.reply({
      content,
      flags: (interaction.options.getBoolean('quiet') ?? false) ? MessageFlags.Ephemeral : undefined
    }).catch(console.error);
  }
}
