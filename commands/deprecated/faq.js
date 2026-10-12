import { getFAQ, getUser, searchFAQNames } from "../db.js";
import { reply } from "../bot.js";
import { formatUser } from "../utils.js";

export default {
  data: {
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
    await interaction.respond(searchFAQNames(interaction.options.getFocused()).map(row => ({ name: row.name, value: row.name })));
  },
  async execute(interaction) {
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    const name = interaction.options.getString("name");
    const faq = getFAQ(name);
    
    if (!faq) return interaction.reply({ content: `> FAQ^\`"${name}"\` is absent`, flags: 64 });

    const authorUser = await interaction.client.users.fetch(faq.author);
    const u = getUser(faq.author);

    await reply(interaction, "faq.result", { name: faq.name, author: formatUser(u.title, authorUser), text: faq.content }, quiet)
  }
};