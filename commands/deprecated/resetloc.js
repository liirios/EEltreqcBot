import { searchLocaleNames } from "../../db.js";
import { getLocale, resetLocale } from "../../locales.js";

export default {
  data: {
    description: "Reset locale",
    options: [
      { name: "name", description: "Name", type: 3, required: true, autocomplete: true },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 3,
  async autocomplete(interaction) {
    await interaction.respond(searchLocaleNames(interaction.options.getFocused()).map(row => ({ name: row.name, value: row.name })));
  },
  async execute(interaction) {
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    const name = interaction.options.getString("name");

    resetLocale(name);

    await interaction.reply({ content: `> Set Locale^\`"${name}"\` to \`"${getLocale(name)}"\``, flags: quiet ? 64 : undefined });
  }
};