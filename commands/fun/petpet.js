import petPetGif from "pet-pet-gif";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { getFormatted } from "../../locales.js";
import { getUser } from "../../db.js";
import { formatUser } from "../../utils.js"
import { InteractionResponse } from "../../enum.js";

export default {
  data: {
    description: "Petpet",
    options: [
      { name: "user", description: "User", type: 6, required: true },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 2,
  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const quiet = interaction.options.getBoolean("quiet");

    if (target.id === interaction.user.id) return interaction.reply({ content: "you silly", flags: 64 });

    await interaction.deferReply({ flags: quiet ? 64 : undefined });

    const member = interaction.options.getMember("user");
    const target_u = getUser(target.id)
    const executor_u = getUser(interaction.user.id)
    const avatarUrl = target.displayAvatarURL({ extension: "png", size: 256 });
    const gifBuffer = await petPetGif(avatarUrl, { resolution: 128, delay: 20 });
    const attachment = new AttachmentBuilder(gifBuffer, { name: "pet.gif" });
    const embed = new EmbedBuilder()
      .setTitle(crop(500, await getFormatted("petpet.result", { target: formatUser(target_u.title, target, member), executor: formatUser(executor_u.title, interaction.user) })))
      .setImage("attachment://pet.gif").setColor(member?.displayColor || null);

    await interaction.editReply({ embeds: [embed], files: [attachment] });
    return InteractionResponse.OK;
  }
};