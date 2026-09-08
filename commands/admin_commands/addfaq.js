import { addFAQ } from "../../db.js";
import { getClipboard, clearClipboard } from "../../clipboard.js";

export default {
  data: {
    name: "addfaq",
    description: "Add a new FAQ from your clipboard",
    options: [
      { name: "name", description: "Name", type: 3, required: true },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 3,
  async execute(interaction) {
    const name = interaction.options.getString("name");
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    const clip = getClipboard(interaction.user.id);

    if (!clip) {
      return interaction.reply({ content: `> empty clipboard`, flags: 64 });
    }

    try {
      addFAQ(name, clip.author, interaction.user.id, clip.content);
    } catch (err) {
      if (err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
        return interaction.reply({ content: `> FAQ^\`"${name}"\` is not absent`, flags: 64 });
      }
      throw err;
    }

    clearClipboard(interaction.user.id);
    await interaction.reply({ content: `> FAQ^\`"${name}"\` added successfully`, flags: quiet ? 64 : undefined });
  }
};