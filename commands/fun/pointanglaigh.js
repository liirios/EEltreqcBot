import { EmbedBuilder, flatten } from "discord.js";
import { getFormatted } from "../../locales.js";
import { InteractionResponse } from "../../enum.js";

export default {
  data: {
    description: "c",
    options: [
      { name: "text", description: "Text", type: 3 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 2,
  async execute(interaction) {
    const text = interaction.options.getString("text");

    await interaction.reply({ embeds: [new EmbedBuilder().setImage("https://media.discordapp.net/attachments/1441357622086471682/1540146393463783566/proxy-image.png?ex=6a88e49a&is=6a87931a&hm=fdca9f14ac953335685b0a6e4569d451533e1635177a51838821c36ff5e1cb0c&=&format=webp&quality=lossless&width=384&height=358").setTitle(getFormatted("pointandlaugh.result", { text: text }))] });
    return InteractionResponse.OK;
  }
}