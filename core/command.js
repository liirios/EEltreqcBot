import { reply } from "../bot.js";
import { searchLocaleNames } from "../db.js";
import { InteractionOption, InteractionResponse } from "../enum.js";
import { getLocale, syncLocales } from "../locales.js";
import { getPerm, getPermName } from "../permissions.js";

export default {
    data: {
        description: "Command",
        options: [
        {
            name: "get", description: "Get command data", type: 1,
            options: [ InteractionOption.KEY_AUTO, InteractionOption.QUIET ]
        },
        {
            name: "unload", type: 2,
            options: [
                {
                    name: "individual", description: "Unload currently loaded command", type: 1,
                    options: [ InteractionOption.KEY_AUTO, InteractionOption.QUIET ]
                },
                {
                    name: "group", description: "Unload currently loaded command group", type: 1,
                    options: [ InteractionOption.KEY_AUTO, InteractionOption.QUIET ]
                }
            ]
        },
        {
            name: "load", type: 2,
            options: [
                {
                    name: "individual", description: "Load currently loaded command", type: 1,
                    options: [ InteractionOption.KEY_AUTO, InteractionOption.QUIET ]
                },
                {
                    name: "group", description: "Load currently loaded command group", type: 1,
                    options: [ InteractionOption.KEY_AUTO, InteractionOption.QUIET ]
                }
            ]
        },
        {
            name: "reload", type: 2,
            options: [
                {
                    name: "individual", description: "Reload currently loaded command", type: 1,
                    options: [ InteractionOption.KEY_AUTO, InteractionOption.QUIET ]
                },
                {
                    name: "group", description: "Reload currently loaded command group", type: 1,
                    options: [ InteractionOption.KEY_AUTO, InteractionOption.QUIET ]
                }
            ]
        }
        ],
        integration_types: [0, 1],
        contexts: [0, 1, 2]
    },
    minPerm: 1,
    async autocomplete(interaction) {
        const subgroup = interaction.options.getSubcommandGroup();
        const sub = interaction.options.getSubcommand();

        const loadedCommands = [...interaction.client.commands.keys()]
        const loadedGroups = [...new Set([...interaction.client.commands.values()].map(c => c.group))];

        switch (subgroup) {
            case "get": {
                
            }
        }

        await interaction.respond(results.map(name => ({ name, value: name })));

    },
    async execute(interaction) {
        const subgroup = interaction.options.getSubcommandGroup();
        const sub = interaction.options.getSubcommand();
        const key = interaction.options.getString("key");
        const quiet = interaction.options.getBoolean("quiet") ?? false;
        const perm = getPerm(interaction.user.id)

        switch (subgroup) {
            case "get": {
                const { data } = interaction.client.commands.get(key);
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
                return InteractionResponse.OK;
            }
            case "load": {
                if (perm < 3) return InteractionResponse.NO_PERM(3);
                switch (sub) {
                    case "individual": {
                        return InteractionResponse.UNIMPL;
                    }
                    case "group": {
                        return InteractionResponse.UNIMPL;
                    }
                }
                break;
            }
            case "unload": {
                if (perm < 3) return InteractionResponse.NO_PERM(3);
                switch (sub) {
                    case "individual": {
                        return InteractionResponse.UNIMPL;
                    }
                    case "group": {
                        return InteractionResponse.UNIMPL;
                    }
                }
                break;
            }
            case "reload": {
                if (perm < 3) return InteractionResponse.NO_PERM(3);
                switch (sub) {
                    case "individual": {
                        return InteractionResponse.UNIMPL;
                    }
                    case "group": {
                        return InteractionResponse.UNIMPL;
                    }
                }
                break;
            }
        }
    }
};