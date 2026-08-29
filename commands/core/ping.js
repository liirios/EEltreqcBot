import { InteractionResponse } from "../../enum.js";
import { getLocale } from "../../locales.js";

export default {
  data: {
    description: "pong",
    options: [{ name: "quiet", description: "Ephemeral", type: 5 }],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 1,
  async execute(interaction) {
    const text = getLocale("ping");
    const quiet = interaction.options.getBoolean("quiet") ?? false;

    const { resource } = await interaction.reply({ content: text, flags: quiet ? 64 : undefined, withResponse: true });
    const sent = resource.message;

    await interaction.editReply(
      `${text}\n-# uptime: ${Math.round(interaction.client.uptime / 3600000)}^h | api.ping: ${interaction.client.ws.ping}^ms | bot.ping: ${sent.createdTimestamp - interaction.createdTimestamp}^ms`
    );
    return InteractionResponse.OK;
  }
};