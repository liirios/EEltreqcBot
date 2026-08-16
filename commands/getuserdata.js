import { getUser } from "../db.js";
import { format } from "../utils.js";
import { getPermName } from "../permissions.js"


export default {
  data: {
    name: "getuserdata",
    description: "Get user data",
    options: [
      { name: "user", description: "User", type: 6, required: true },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 1,
  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const member = interaction.options.getMember("user");
    const quiet = interaction.options.getBoolean("quiet") ?? false;

    const u = getUser(target.id);

    await interaction.reply({
      content: `> ${format(u.title, target, member)}: perm^${u.perm} (${getPermName(u.perm)}), title \`${u.title}\``,
      flags: quiet ? 64 : undefined
    });
  }
};