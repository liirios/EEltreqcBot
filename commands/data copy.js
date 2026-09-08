import fs from "fs";
import path from "path";
import { EmbedBuilder, flatten } from "discord.js";

export default {
  data: {
    name: "embed",
    description: "c",
    options: [
      { name: "number", description: "Number", type: 3, required: true }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 3,
  async execute(interaction) {
    const number = interaction.options.getString("number");

    const data = JSON.parse(fs.readFileSync(path.join("./data", "data.json"), "utf8"));
    const link = data[number];

    if (!link) return interaction.reply({ content: "No link found.", flags: 64 }).catch(console.error);

    const embed = new EmbedBuilder().setImage(link);

    await interaction.reply({ embeds: [embed] }).catch(console.error);
  }
}