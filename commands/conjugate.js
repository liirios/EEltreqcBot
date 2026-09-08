export default {
  data: {
    name: "conjugate",
    description: "Conjugates your desired noun or verb",
    options: [
      { name: "stem", description: "Stem", type: 3, required: true },
      { name: "prefix", description: "Prefix", type: 3 },
      { name: "suffix", description: "Suffix", type: 3 },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 1,
  async execute(interaction) {
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    const stem = interaction.options.getString("stem");
    const prefix = interaction.options.getString("prefix") || "";
    const suffix = interaction.options.getString("suffix") || "";

    await interaction.reply({ content: `> ${AFFIXES.connect(prefix, stem, suffix)}`, flags: quiet ? 64 : undefined });
  }
};