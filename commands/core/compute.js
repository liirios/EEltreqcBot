import {Option, Result, Setting} from "../../enum.js";
import {reply, editReply} from "../../bot.js";
import {format} from "../../locales.js";
import {getQuiet} from "../../utils.js";
export default {
  data: {
    name: "compute",
    description: "compute",
    options: [
      Option.VALUE,
      {name: "channel", description: "Channel ID", type: 3},
      {name: "reply", description: "Reply message ID", type: 3},
      Option.QUIET
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  settings: [Setting.PERM(4, false)],
  async execute(interaction) {
    const text = interaction.options.getString("value");
    const channel_id = interaction.options.getString("channel");
    const reply_id = interaction.options.getString("reply");

    const result = await format(text);

    if (channel_id) {
      await interaction.deferReply({flags: 64});
      let channel
      if (channel_id === "here") channel = interaction.channel;
      else channel = await interaction.client.channels.fetch(channel_id);
      let message_id = reply_id;
      if (reply_id === "up") message_id = (await channel.messages.fetch({limit: 1})).first()?.id;
      const sent = await channel.send({content: result, reply: message_id ? {messageReference: message_id, failIfNotExists: false } : undefined });
      await editReply(interaction, "compute.result.sent", {"link": sent.url}, true);
      return Result.OK;
    }

    await reply(interaction, "compute.result", {"text": result}, getQuiet(interaction))
    return Result.OK;
  }
};