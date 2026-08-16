import { searchLocaleNames } from "../db.js";
import { setLocale } from "../locales.js";

export default {
  data: {
    name: "setloc",
    description: "Set locale",
    options: [
      { name: "name", description: "Name", type: 3, required: true, autocomplete: true },
      { name: "value", description: "Value", type: 3 },
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
    const value = interaction.options.getString("value");

    setLocale(name, value);

    await interaction.reply({ content: `> Set Locale^\`"${name}"\` to \`"${value}"\``, flags: quiet ? 64 : undefined });
  }
};