import { InteractionOption, InteractionResponse } from "../../enum.js";
import { CONTEXT_TYPES, getLocale, INTEGRATION_TYPES, OPTION_TYPES, syncLocales } from "../../locales.js";
import { getPerm, getPermName } from "../../permissions.js";
import { getCommandGroups, getCommands, simpleFilter } from "../../utils.js";

export default {
    data: {
        description: "Command",
        options: [
        {
            name: "get", description: "Get command data (Do not spam/flood with it)", type: 1,
            options: [ InteractionOption.KEY_AUTO, InteractionOption.QUIET ]
        },
        {
            name: "load", description: "Load ...", type: 2,
            options: [
                {
                    name: "individual", description: "Load command", type: 1,
                    options: [
                        InteractionOption.KEY_AUTO,
                        { name: "group", description: "Group", type: 3, required: true, autocomplete: true },
                        InteractionOption.QUIET
                    ]
                },
                {
                    name: "group", description: "Load command group", type: 1,
                    options: [ InteractionOption.KEY_AUTO, InteractionOption.QUIET ]
                }
            ]
        },
        {
            name: "unload", description: "Unload ...", type: 2,
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
            name: "reload", description: "Reload ...", type: 2,
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
        const focused = interaction.options.getFocused(true);
        const group = interaction.options.getString("group");

        let entries = []
        if (sub == "get") entries = [...interaction.client.commands.keys()];
        else {
            switch (subgroup) {
                case "load": {
                    switch (sub) {
                        case "individual": {
                            switch (focused.name) {
                                case "group": { entries = getCommandGroups(); break; }
                                case "key": { entries = getCommands(group); break;
                                }
                            }
                        }
                        case "group": { entries = getCommandGroups(); break; }
                    }
                    break;
                }
                case "unload":
                case "reload": {
                    switch (sub) {
                        case "individual": { entries = [...interaction.client.commands.keys()]; break; }
                        case "group": { entries = [...new Set([...interaction.client.commands.values()].map(c => c.group))]; break; }
                    }
                    break;
                }
            }
        }

        await interaction.respond(simpleFilter(entries, focused.value).map(name => ({ name, value: name })));

    },
    async execute(interaction) {
        const subgroup = interaction.options.getSubcommandGroup();
        const sub = interaction.options.getSubcommand();
        const key = interaction.options.getString("key");
        const quiet = interaction.options.getBoolean("quiet") ?? false;
        const perm = getPerm(interaction.user.id);


        if (sub == "get") {
            const command = interaction.client.commands.get(key);
            const minPerm = command.minPerm ?? 0;
            const options = Array.isArray(command.data.options) ? command.data.options : [];
            const optionLines = options.length > 0 ? options.map(opt => `> - \`${opt.name}\`: ${OPTION_TYPES[opt.type] ?? `Unknown(${opt.type})`}`).join("\n") : "> - none";
            const integrationTypes = Array.isArray(command.data.integration_types) && command.data.integration_types.length > 0 ? command.data.integration_types.map(v => INTEGRATION_TYPES[v] ?? `Unknown(${v})`).join(", ") : "none";
            const contexts = Array.isArray(command.data.contexts) && command.data.contexts.length > 0 ? command.data.contexts.map(v => CONTEXT_TYPES[v] ?? `Unknown(${v})`).join(", ") : "none";
            const content = [
                `cmd^\`/${command.data.name}\`:`,
                `> Description: ${command.data.description}`,
                `> Permission: perm^${minPerm} (${getPermName(minPerm)}) or higher`,
                `> Integration types: ${integrationTypes}`,
                `> Contexts: ${contexts}`,
                `> Options:`,
                optionLines
            ].join("\n");
        
            await interaction.reply({ content, flags: quiet ? 64 : undefined });
            return InteractionResponse.OK;
        }

        switch (subgroup) {
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