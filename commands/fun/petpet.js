import {Option, Result, Setting} from "../../enum.js";
import petPetGif from "pet-pet-gif";
import {AttachmentBuilder, EmbedBuilder} from "discord.js";
import {getFormatted} from "../../locales.js";
import {formatUser, getQuiet, crop} from "../../utils.js"
import {USERS} from "../../db/db.js";

export default {
  data: {
    description: "Petpet",
    options: [
      {name: "user", description: "User", type: 6, required: true},
      Option.QUIET
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  settings: [Setting.PERM(1, false)],
  async execute(interaction) {
    const target = interaction.options.getUser("user");

    await interaction.deferReply({flags: getQuiet(interaction) ? 64 : undefined});

    if (target.id === interaction.user.id) return interaction.editReply({content: "you silly", flags: 64});

    const member = interaction.options.getMember("user");
    const target_u = USERS.get(target.id)
    const executor_u = USERS.get(interaction.user.id)
    const avatarUrl = target.displayAvatarURL({extension: "png", size: 256});
    const gifBuffer = await petPetGif(avatarUrl, {resolution: 128, delay: 20});
    const attachment = new AttachmentBuilder(gifBuffer, {name: "pet.gif"});
    const embed = new EmbedBuilder()
      .setTitle(crop(500, await getFormatted("petpet.result", {target: formatUser(target_u.title, target, member), executor: formatUser(executor_u.title, interaction.user)})))
      .setImage("attachment://pet.gif").setColor(member?.displayColor || null);

    await interaction.editReply({embeds: [embed], files: [attachment]});
    return Result.OK;
  }
};