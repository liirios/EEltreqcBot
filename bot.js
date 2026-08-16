import fs from "fs";
import path from "path";
import { Client, Collection, GatewayIntentBits, REST, Routes, Events } from "discord.js";
import { fileURLToPath, pathToFileURL } from "url";
import { getFormatted } from "./locales.js";
import { getPerm, getPermName } from "./permissions.js";

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


// TODO: Move to ./events/ & implement events loading
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command?.autocomplete) return;

        try { await command.autocomplete(interaction); }
        catch (err) { console.error(`! Autocomplete error: ${command.data.name}:`, err); }
        return;
    }

    if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (command.minPerm) {
        const perm = getPerm(interaction.user.id)
        if (perm < command.minPerm) {
        return interaction.reply({
            content: `
> Insufficient permissions
> You got: perm^${perm} (${getPermName(perm)})
> Required: perm^${command.minPerm} (${getPermName(command.minPerm)}) or higher`,
            flags: 64
        }).catch(console.error);
        }
    }

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(`! Error ${command.data.name}:`, err);
        const reply = { content: getFormatted("error"), flags: 64 };
        if (interaction.replied || interaction.deferred) await interaction.followUp(reply).catch(console.error);
        else await interaction.reply(reply).catch(console.error);
    }
});

client.on("error", console.error);

export async function loadCommands(dir) {
    if (!client.commands) client.commands = new Collection();

    const rootDir = path.join(__dirname, dir);

    console.log(`Loading ./${dir}`);

    if (!fs.existsSync(rootDir)) {
        console.warn(`! Missing directory: ./${dir}`);
        return client.commands;
    }

    await applyCommands(client.commands, rootDir);

    return client.commands;
}

export async function applyCommands(commands, dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            await applyCommands(commands, fullPath);
            continue;
        }

        if (!entry.name.endsWith(".js")) continue;

        const fileUrl = `${pathToFileURL(fullPath).href}?update=${Date.now()}`;
        const imported = await import(fileUrl);
        const command = imported.default;

        if (!command?.data?.name || typeof command.execute !== "function") {
            console.warn(`! Invalid command: ${entry.name}`);
            continue;
        }

        if (commands.has(command.data.name)) console.warn(`! Duplicate command "${command.data.name}" in ${fullPath}`);
        commands.set(command.data.name, command);

        const relPath = path.relative(__dirname, fullPath).split(path.sep).join("/");
        console.log(`Loaded ./${relPath}`);
    }
}

export async function registerCommands() {
    console.log("Registering commands")
    const commandData = [...client.commands.values()].map(cmd => cmd.data);
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commandData }
    );
    console.log("Registered all commands")
}


export async function loadEvents(dir) {

}



export async function startBot() {
    console.log("Starting bot")
    await client.login(process.env.DISCORD_TOKEN);
    console.log("Bot is up and running :3")
}