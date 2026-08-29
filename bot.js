import fs from "fs";
import path from "path";
import { Client, Collection, GatewayIntentBits, REST, Routes, Events } from "discord.js";
import { fileURLToPath, pathToFileURL } from "url";
import { getFormatted } from "./locales.js";
import { getPerm, getPermName } from "./permissions.js";
import { error, info, silly, warn } from "./logger.js";
import { crop, getCommands } from "./utils.js";
import { InteractionResponse } from "./enum.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
client.commands = new Collection();

// TODO: Move to ./events/ & implement events loading
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command?.autocomplete) return;

        try { await command.autocomplete(interaction); }
        catch (err) { error(`Autocomplete ${command.data.name}: ${err}`); }
        return;
    }

    if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;


    let response = null; 

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const perm = getPerm(interaction.user.id)
    if (command.minPerm && perm < command.minPerm) response = InteractionResponse.NO_PERM(command.minPerm)

    if (response == null) {
        try {
            response = await command.execute(interaction);
        } catch (err) {
            response = InteractionResponse.ERROR;
            error(`Command ${command.data.name}: ${err}`);
        }
    }

    let reply_content = null;

    switch (response) {
        case InteractionResponse.ERROR: {
            reply_content = { content: await getFormatted("error"), flags: 64 };
            break;
        }
        case InteractionResponse.UNIMPL: {
            reply_content = { content: await getFormatted("error.unimplemented"), flags: 64 };
            break;
        }
        case InteractionResponse.NO_PERM: {
            reply_content = {
                content: `
> Insufficient permissions
> You got: perm^${perm} (${getPermName(perm)})
> Required: perm^${response.arg ?? "?"} (${response.arg != null ? getPermName(response.arg) : "Unspecified"}) or higher`,
                flags: 64
            };
            break;
        }
        case InteractionResponse.COOLDOWN: {
            reply_content = { content: await getFormatted("error.cooldown", {remaining: response.arg ?? "Unspecified" }), flags: 64 };
            break;
        }
        case InteractionResponse.CUSTOM: {
            reply_content = { content: response.arg ?? "Unspecified", flags: 64 };
            break;
        }
    }
    
    if (response == null) warn(`Command ${command.data.name} returned null response`);

    if (reply_content != null) return interaction.reply(reply_content).catch(err => error(`Error reply with response ${response} in ${command.data.name}: ${err}`));
});

// client.on("error", error);

export async function loadEvents(dir) {

}




export async function loadCommand(name, group) {
    let dir = path.join(__dirname, "commands", group, name+".js");
    
    const imported = await import(`${pathToFileURL(dir).href}?update=${Date.now()}`);
    const command = imported.default;

    command.group = group;
    command.data.name = name;

    if (typeof command?.execute !== "function") return warn(` Invalid command format: ${name}`);
    if (client.commands.has(name)) {
        const other = client.commands.get(name).group;
        if (other === group) warn(` Duplicate command in same group: "${name}"`);
        else warn(` Duplicate of command from different group "${other}": "${name}"`);
    }
    // TODO: Make more checks :3

    client.commands.set(command.data.name, command);
    
    info(` Loaded command "${name}"`);
}

export async function unloadCommand(name) {
    if (!client.commands.has(name)) return warn(`Failed unloading command "${name}", not present`)
    client.commands.delete(name);

    info(` Unloaded command "${name}"`);
}

export async function loadCommandGroup(group) {
    info(`Loading command group "${group}"`);

    const entries = getCommands(group)
    if (entries == null) return warn(`Missing directory: ./commands/${group}`);
    await Promise.all(entries.map(i => loadCommand(i, group)))

    info(`Loaded command group "${group}"`);
}

export async function unloadCommandGroup(group) {
    info(`Unloading command group "${group}"`)

    for (const command of client.commands.values()) {
        if (command.group !== group) continue;
        unloadCommand(command.data.name)
    }

    info(`Unloaded command group "${group}"`)
}

export async function registerCommands() {
    info("Registering commands")

    const commandData = [...client.commands.values()].map(cmd => cmd.data);
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commandData }
    );

    info("Registered all commands")
}

export async function startBot() {
    info("Loggining")

    await client.login(process.env.DISCORD_TOKEN);
    
    info("Bot is up and running :3")
    silly("Meow")
}

export async function reply(interaction, locale, args, quiet = false) {
    let content = await getFormatted(locale, args);
    content = crop(2000, content);
    return interaction.reply({ content, flags: quiet ? 64 : undefined });
}