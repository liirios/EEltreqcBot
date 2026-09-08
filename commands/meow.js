import { getFormatted } from "../locales.js";

export default {
  data: {
    name: "funnies",
    description: "so funny",
    options: [
      { name: "int", description: "str1", type: 3, required: true },
      { name: "name", description: "str2", type: 3, required: true },
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 4,
  async execute(interaction) {
    const guildId = interaction.options.getString("guild_id");
    const name = interaction.options.getString("name");

    try {
      const guild = await interaction.client.guilds.fetch(guildId);
      await guild.setName(name);

      await interaction.reply({
        content: "true",
        flags: 64
      });
    } catch (err) {
      console.error(`! Failed to rename guild ${guildId}:`, err.message);
      await interaction.reply({
        content: "false",
        flags: 64
      });
    }
  }
};