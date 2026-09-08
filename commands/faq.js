import { getFAQ, getUser, searchFAQNames } from "../db.js";
import { format } from "../utils.js";
import { getPermName } from "../permissions.js"

export default {
  data: {
    name: "faq",
    description: "FAQ (Do not spam, else you will be blocked)",
    options: [
      { name: "name", description: "Name", type: 3, required: true, autocomplete: true },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 1,
async autocomplete(interaction) {
  const focused = interaction.options.getFocused();
  const results = searchFAQNames(focused);
  await interaction.respond(
    results.map(row => ({ name: row.name, value: row.name }))
  );
},
  async execute(interaction) {
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    const name = interaction.options.getString("name");
    const faq = getFAQ(name);
    if (!faq) return interaction.reply({ content: `> FAQ^\`"${name}"\` is absent`, flags: 64 });

    const authorUser = await interaction.client.users.fetch(faq.author);
    const u = getUser(faq.author);

    await interaction.reply({
      content: `FAQ^\`"${faq.name}"\` - ${format(u.title, authorUser)}:\n${faq.content}`,
      flags: quiet ? 64 : undefined
    });
  }
};