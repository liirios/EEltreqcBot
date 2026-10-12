import {Option, Result, Setting} from "../../enum.js";
import {getLocale} from "../../locales.js";
import {getQuiet} from "../../utils.js";

export default {
  data: {
    description: "pong",
    options: [{name: "quiet", description: "Ephemeral", type: 5}],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  settings: [Setting.PERM(1, false)],
  async execute(interaction) {
    const text = getLocale("ping");

    const {resource} = await interaction.reply({content: text, flags: getQuiet(interaction) ? 64 : undefined, withResponse: true});
    const sent = resource.message;

    await interaction.editReply(
      `${text}\n-# uptime: ${Math.round(interaction.client.uptime / 3600000)}^h | api.ping: ${interaction.client.ws.ping}^ms | bot.ping: ${sent.createdTimestamp - interaction.createdTimestamp}^ms`
    );
    return Result.OK;
  }
};