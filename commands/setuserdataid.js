import { setUser, getUser } from '../db.js';

export default {
  data: {
    name: "setuserdataid",
    description: "Set a user's perm/title by ID",
    options: [
      { name: "id", description: "Discord ID", type: 3, required: true },
      { name: "perm", description: "Permission level", type: 4 },
      { name: "title", description: "Title", type: 3 },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 3,
  async execute(interaction) {
    const id = interaction.options.getString("id");
    const perm = interaction.options.getInteger("perm");
    const title = interaction.options.getString("title");
    const quiet = interaction.options.getBoolean("quiet") ?? false;

    setUser(id, perm, title);
    const u = getUser(id);

    await interaction.reply({
      content: `> Successfully set ${target.username}: perm ${u.perm}, title ${u.title ?? "{user}"}`,
      flags: quiet ? 64 : undefined
    });
  }
};