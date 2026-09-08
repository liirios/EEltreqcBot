import fs from "fs";
import path from "path";
import { EmbedBuilder, flatten } from "discord.js";

export default {
  data: {
    name: "embed",
    description: "c",
    options: [
      { name: "text", description: "Text", type: 3 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 4,
  async execute(interaction) {
    const text = interaction.options.getString("text");

    await interaction.reply({ embeds: [new EmbedBuilder().setImage(text)] });
  }
}