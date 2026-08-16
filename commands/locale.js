import { searchLocaleNames } from "../db.js";
import { getLocale } from "../locales.js";

export default {
  data: {
    name: "locale",
    description: "Locale",
    options: [
      { name: "name", description: "Name", type: 3, required: true, autocomplete: true },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 1,
  async autocomplete(interaction) {
    await interaction.respond(searchLocaleNames(interaction.options.getFocused()).map(row => ({ name: row.name, value: row.name })));
  },
  async execute(interaction) {
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    const name = interaction.options.getString("name");
    const locale = getLocale(name);

    await interaction.reply({ content: `> Locale^\`"${name}"\`: ${locale}\n`, flags: quiet ? 64 : undefined });
  }
};