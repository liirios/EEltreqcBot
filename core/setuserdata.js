import { setUser, getUser } from "../db.js";
import { formatUser } from "../utils.js";
import { getPermName } from "../permissions.js"

export default {
  data: {
    name: "setuserdata",
    description: "Set user data",
    options: [
      { name: "user", description: "User", type: 6, required: true },
      { name: "perm", description: "Permission level", type: 4 },
      { name: "title", description: "Title", type: 3 },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 4,
  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const member = interaction.options.getMember("user")
    const perm = interaction.options.getInteger("perm");
    const title = interaction.options.getString("title");
    const quiet = interaction.options.getBoolean("quiet") ?? false;

    setUser(target.id, perm, title);
    const u = getUser(target.id);

    await interaction.reply({
      content: `> Successfully set ${formatUser(u.title, target, member)}: perm^${u.perm} (${getPermName(u.perm)}), title \`${u.title}\``,
      flags: quiet ? 64 : undefined
    });
  }
};