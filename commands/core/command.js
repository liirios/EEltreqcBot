import {Option, Result, Setting} from "../../enum.js";
import {getCommandGroups, getCommands, loadCommand, loadCommandGroup, registerCommands, unloadCommand, unloadCommandGroup} from "../../commands.js";
import {getPerm, getPermName} from "../../permissions.js";
import {simpleFilter} from "../../utils.js";

export default {
    data: {
        description: "Command",
        options: [
        {
            name: "get", description: "Get command data (Do not spam/flood with it)", type: 1,
            options: [ Option.KEY_AUTO, Option.QUIET ]
        },
        {
            name: "load", description: "Load command", type: 2,
            options: [
                {
                    name: "individual", description: "Load command", type: 1,
                    options: [
                        {name: "group", description: "Group", type: 3, required: true, autocomplete: true},
                        Option.KEY_AUTO,
                        Option.QUIET
                    ]
                },
                {
                    name: "group", description: "Load command group", type: 1,
                    options: [ Option.KEY_AUTO, Option.QUIET ]
                }
            ]
        },
        {
            name: "unload", description: "Unload command", type: 2,
            options: [
                {
                    name: "individual", description: "Unload currently loaded command", type: 1,
                    options: [ Option.KEY_AUTO, Option.QUIET ]
                },
                {
                    name: "group", description: "Unload currently loaded command group", type: 1,
                    options: [ Option.KEY_AUTO, Option.QUIET ]
                }
            ]
        },
        {
            name: "reload", description: "Reload command", type: 2,
            options: [
                {
                    name: "individual", description: "Reload currently loaded command", type: 1,
                    options: [ Option.KEY_AUTO, Option.QUIET ]
                },
                {
                    name: "group", description: "Reload currently loaded command group", type: 1,
                    options: [ Option.KEY_AUTO, Option.QUIET ]
                }
            ]
        }
        ],
        integration_types: [0, 1],
        contexts: [0, 1, 2]
    },
    settings: [Setting.PERM(1, false)],
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
                                case "group": {entries = getCommandGroups(); break;}
                                case "key": {entries = getCommands(group); break;}
                            }
                            break;
                        }
                        case "group": {entries = getCommandGroups(); break;}
                    }
                    break;
                }
                case "unload":
                case "reload": {
                    switch (sub) {
                        case "individual": {entries = [...interaction.client.commands.keys()]; break;}
                        case "group": {entries = [...new Set([...interaction.client.commands.values()].map(c => c.group))]; break;}
                    }
                    break;
                }
            }
        }

        await interaction.respond(simpleFilter(entries, focused.value).map(name => ({name, value: name})));
    },
    async execute(interaction) {
        const subgroup = interaction.options.getSubcommandGroup();
        const sub = interaction.options.getSubcommand();
        const key = interaction.options.getString("key");
        const group = interaction.options.getString("group");


        if (sub == "get") {
            return Result.UNIMPL;
        }

        if (getPerm(interaction.user.id) < 3) return Result.NO_PERM(3, false);
        switch (subgroup) {
            case "load": {
                switch (sub) {
                    case "individual": {
                        await loadCommand(key, group);
                        return Result.OK;
                    }
                    case "group": {
                        await loadCommandGroup(key);
                        return Result.OK;
                    }
                }
                break;
            }
            case "unload": {
                switch (sub) {
                    case "individual": {
                        await unloadCommand(key);
                        return Result.OK;
                    }
                    case "group": {
                        await unloadCommandGroup(key);
                        return Result.OK;
                    }
                }
                break;
            }
            case "reload": {
                switch (sub) {
                    case "individual": {
                        const g = interaction.client.commands.get(key).group;
                        await unloadCommand(key);
                        await loadCommand(key, g);
                        return Result.OK;
                    }
                    case "group": {
                        await unloadCommandGroup(key);
                        await loadCommandGroup(key);
                        return Result.OK;
                    }
                }
                break;
            }
        }
        await registerCommands()
    }
};