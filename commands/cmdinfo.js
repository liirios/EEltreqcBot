import { OPTION_TYPES, CONTEXT_TYPES, INTEGRATION_TYPES } from "../locales.js"
import { getPermName } from "../permissions.js"

export default {
  data: {
    name: "cmdinfo",
    description: "Command properties (do not spam)",
    options: [
      { name: "name", description: "Name", type: 3, required: true, autocomplete: true },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 1,
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const results = [...interaction.client.commands.keys()].filter(name => name.toLowerCase().includes(focused)).slice(0, 25);
    await interaction.respond(results.map(name => ({ name, value: name })));
  },
  async execute(interaction) {
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    const name = interaction.options.getString("name");
    const command = interaction.client.commands.get(name);

    if (!command) return interaction.reply({ content: `> Command^\`"${name}"\` is absent`, flags: 64 });
 
    const { data } = command;
    const minPerm = command.minPerm ?? 0;
    const options = Array.isArray(data.options) ? data.options : [];
    const optionLines = options.length > 0 ? options.map(opt => `> - \`${opt.name}\`: ${OPTION_TYPES[opt.type] ?? `Unknown(${opt.type})`}`).join("\n") : "> - none";
    const integrationTypes = Array.isArray(data.integration_types) && data.integration_types.length > 0 ? data.integration_types.map(v => INTEGRATION_TYPES[v] ?? `Unknown(${v})`).join(", ") : "none";
    const contexts = Array.isArray(data.contexts) && data.contexts.length > 0 ? data.contexts.map(v => CONTEXT_TYPES[v] ?? `Unknown(${v})`).join(", ") : "none";
    const content = [
      `cmd^\`/${data.name}\`:`,
      `> Description: ${data.description}`,
      `> Permission: perm^${minPerm} (${getPermName(minPerm)}) or higher`,
      `> Integration types: ${integrationTypes}`,
      `> Contexts: ${contexts}`,
      `> Options:`,
      optionLines
    ].join("\n");
 
    await interaction.reply({ content, flags: quiet ? 64 : undefined });
  }
};
 
