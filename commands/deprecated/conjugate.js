import { reply } from "../../bot.js";

export default {
  data: {
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

    let content = await getFormatted("conjugate.result", {text:AFFIXES.connect(prefix, stem, suffix)})
    content = crop(2000, content)

    await interaction.reply({ content: content, flags: quiet ? 64 : undefined });
  }
};