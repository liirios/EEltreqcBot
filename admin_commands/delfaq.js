import { delFAQ, getFAQ, searchFAQNames } from "../db.js";


export default {
  data: {
    name: "delfaq",
    description: "Delete FAQ",
    options: [
      { name: "name", description: "Name", type: 3, required: true, autocomplete: true },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 3,
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const results = searchFAQNames(focused);

    await interaction.respond(results.map(row => ({ name: row.name, value: row.name })));
  },
  async execute(interaction) {
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    const name = interaction.options.getString("name");
    const faq = getFAQ(name);
    if (!faq) return interaction.reply({ content: `> FAQ^\`"${name}"\` is absent`, flags: 64 });

    delFAQ(name)

    await interaction.reply({
      content: `> FAQ^\`"${faq.name}"\` deleted successfully`,
      flags: quiet ? 64 : undefined
    });
  }
};