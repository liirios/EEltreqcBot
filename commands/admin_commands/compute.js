import { InteractionOption } from "../../enum.js";
import { format } from "../../locales.js";
export default {
  data: {
    name: "compute",
    description: "compute",
    options: [
      { name: "text", description: "Text", type: 3, required: true },
      { name: "channel", description: "Channel ID", type: 3 },
      { name: "server", description: "Server ID", type: 3 },
      InteractionOption.QUIET
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 3,
  async execute(interaction) {
    const text = interaction.options.getString("text");
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    const channelId = interaction.options.getString("channel");
    const serverId = interaction.options.getString("server");
    const result = await format(text);

    if (channelId) {
      const guild = serverId ? await interaction.client.guilds.fetch(serverId) : interaction.guild;
      const channel = await guild.channels.fetch(channelId);
      await channel.send({ content: result });
      return interaction.reply({ content: `Sent to <#${channelId}>`, flags: 64 });
    }

    interaction.reply({ content: result, flags: quiet ? 64 : undefined });
  }
};