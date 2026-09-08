import { query } from "../logger.js";
import { crop } from "../utils.js";

export default {
  data: {
    description: "log",
    options: [
      { name: "count", description: "Count", type: 4 },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 3,
  async execute(interaction) {
    const count = interaction.options.getInteger("count") ?? 10;
    const quiet = interaction.options.getBoolean("quiet") ?? false;

    query({ limit: count }, (err, results) => {
      const content = (Object.values(results ?? {})[0] ?? []).map(e => `> ${e.timestamp} - ${e.level}: ${e.message}`).join("\n") || "No logs found.";
      content = crop(2000, content)

      interaction.reply({ content: content, flags: quiet ? 64 : undefined });
    });
  }
};