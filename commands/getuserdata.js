import { getUser } from "../db.js";
import { reply } from "../bot.js";
import { getPermName } from "../permissions.js"


export default {
  data: {
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
    const quiet = interaction.options.getBoolean("quiet") ?? false;

    const u = getUser(target.id);

    await reply(interaction, "getuserdata.result", { target: target.username, id: target.id, perm: u.perm, perm_name: getPermName(u.perm), title: u.title }, quiet)
  }
};