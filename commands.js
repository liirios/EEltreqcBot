import path from "path";
import {Collection, Events, MessageFlags, REST, Routes} from "discord.js";
import {fileURLToPath} from "url";
import {error, info, warn} from "./logger.js";
import {checks, getGroups, getJSFiles, importFile} from "./utils.js";
import {getFormatted} from "./locales.js";
import {getPerm, getPermName} from "./permissions.js";
import {client} from "./bot.js";
import {Result, Setting} from "./enum.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

client.commands ??= new Collection();

export function getCommandGroups() {
    return getGroups(path.join(__dirname, "commands"), false);
}

export function getCommands(group) {
    return getJSFiles(path.join(__dirname, "commands", group));
}

export async function loadCommand(name, group) {
    const command = await importFile(path.join(__dirname, "commands", group, name + ".js"));

    if (typeof command?.execute !== "function") return warn(` Execute is not a function or not present at all: ${name}`);
    if (command?.autocomplete !== undefined && typeof command?.autocomplete !== "function") return warn(` Autocomplete is not a function: ${name}`);

    command.servers = null;
    if (command.settings !== undefined) {
        if (!Array.isArray(command.settings)) return warn(` Settings must be an array or undefined: ${name}`);
        for (const setting of command.settings) {
            if (!setting.validate()) return warn(` Invalid settings in ${name}: ${setting["@@tag"]}`);
            if (Setting.SERVER.is(setting) && !setting.reverse) command.servers = setting.ids;
        }
    }

    command.group = group;
    command.data.name = name;
    if (client.commands.has(name)) {
        const other = client.commands.get(name).group;
        if (other === group) warn(` Duplicate command in same group: "${name}"`);
        else warn(` Duplicate of command from different group "${other}": "${name}"`);
    }

    client.commands.set(command.data.name, command);

    info(` Loaded command "${name}"`);
}

export async function unloadCommand(name) {
    if (!client.commands.has(name)) return warn(`Failed unloading command "${name}", not present`);
    client.commands.delete(name);

    info(` Unloaded command "${name}"`);
}

export async function loadCommandGroup(group) {
    info(`Loading command group "${group}"`);

    const entries = getCommands(group);
    if (entries == null) return warn(`Missing directory: ./commands/${group}`);
    await Promise.all(entries.map(i => loadCommand(i, group)));
}

export async function unloadCommandGroup(group) {
    info(`Unloading command group "${group}"`);

    for (const command of [...client.commands.values()]) {
        if (command.group !== group) continue;
        await unloadCommand(command.data.name);
    }
}

export async function loadAllCommandGroups(ignoring = true) {
    const groups = getGroups(path.join(__dirname, "commands"), ignoring);
    info(`Found command groups: ${groups.join(", ") || "none"}`);

    for (const group of groups) await loadCommandGroup(group);
    info(`Loaded all command groups`);
}

export async function registerCommands() {
    info("Registering commands");

    const rest = new REST({version: "10"}).setToken(process.env.DISCORD_TOKEN);

    const globalData = [];
    const guildData = new Map();

    for (const cmd of client.commands.values()) {
        if (cmd.servers == null) {
            globalData.push(cmd.data);
            continue;
        }
        for (const id of cmd.servers) {
            if (!guildData.has(id)) guildData.set(id, []);
            guildData.get(id).push(cmd.data);
        }
    }

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {body: globalData});

    for (const id of client.guilds.cache.keys()) if (!guildData.has(id)) guildData.set(id, []);

    const ids = [...guildData.keys()];
    const results = await Promise.allSettled(
        ids.map(id => rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, id),
            {body: guildData.get(id)}
        ))
    );

    results.forEach((r, i) => {
        if (r.status === "rejected") warn(`Failed registering commands in guild ${ids[i]}: ${r.reason?.message ?? r.reason}`);
    });

    info("Registered all commands");
}

async function formatResponse(response, interaction) {
    switch (true) {
        case Result.ERROR.is(response): return getFormatted("error");
        case Result.UNIMPL.is(response): return getFormatted("error.unimplemented");
        case Result.NO_PERM.is(response): {
            const perm = getPerm(interaction.user.id);
            return `
> Insufficient permissions
> You got: perm^${perm} (${getPermName(perm)})
> Required: ${response.reverse ? "below " : ""}perm^${response.required ?? "?"} (${response.required != null ? getPermName(response.required) : "Unspecified"})${response.reverse ? "" : " or higher"}`;
        }
        case Result.COOLDOWN.is(response): return getFormatted("error.cooldown", {remaining: response.remaining ?? "Unspecified"});
        case Result.CUSTOM.is(response): return response.message ?? "Unspecified";
        default: return null;
    }
}

export async function runCommand(interaction) {
    const autocomplete = interaction.isAutocomplete();
    if (!autocomplete && !interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    if (autocomplete && !command.autocomplete) return;
    if (command.servers && !command.servers.includes(interaction.guildId)) return;

    let response;
    try {
        const failed = await checks(command.settings, interaction);

        if (failed) response = failed.denial();
        else if (autocomplete) response = await command.autocomplete(interaction);
        else response = await command.execute(interaction);
    } catch (err) {
        error(`${autocomplete ? "Autocomplete" : "Command"} ${command.data.name}: ${err.stack}`);
        response = Result.ERROR(err.stack);
    }

    if (response == null) warn(`Command ${command.data.name} returned null response`);

    const content = await formatResponse(response, interaction);
    if (content == null) return;

    const reply = {content, flags: MessageFlags.Ephemeral};
    const send = interaction.deferred || interaction.replied ? interaction.followUp(reply) : interaction.reply(reply);

    await send.catch(err => error(`Error reply with response ${response} in ${command.data.name}: ${err.stack}`));
}

export function runCommandListener() {
    if (client.commandListener) client.removeListener(Events.InteractionCreate, client.commandListener);

    client.commandListener = interaction => runCommand(interaction).catch(err => error(`Interaction handler: ${err.stack}`));
    client.on(Events.InteractionCreate, client.commandListener);

    info("Started command listener");
}