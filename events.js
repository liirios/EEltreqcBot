import fs from "fs";
import path from "path";
import {Collection} from "discord.js";
import {fileURLToPath, pathToFileURL} from "url";
import {error, info, warn} from "./logger.js";
import {client} from "./bot.js";
import {getGroups, getJSFiles, importFile, checks} from "./utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

client.events ??= new Collection();

export function getEventGroups() {
    return getGroups(path.join(__dirname, "events"), false);
}

export function getEvents(group) {
    return getJSFiles(path.join(__dirname, "events", group));
}

export async function loadEvent(name, group) {
    const event = await importFile(path.join(__dirname, "events", group, name + ".js"));

    if (typeof event?.execute !== "function") return warn(` Execute is not a function or not present at all: ${name}`);
    if (typeof event?.event !== "string") return warn(` Event is not a string or not present at all: ${name}`);

    if (event.settings !== undefined) {
        if (!Array.isArray(event.settings)) return warn(` Settings must be an array or undefined: ${name}`);
        for (const setting of event.settings) {
            if (!setting.validate()) return warn(` Invalid settings in ${name}: ${setting["@@tag"]}`);
        }
    }

    event.once ??= false;
    event.group = group;
    event.name = name;
    event.registered = false;

    if (client.events.has(name)) {
        const other = client.events.get(name).group;
        if (other === group) warn(` Duplicate event in same group: "${name}"`);
        else warn(` Duplicate of event from different group "${other}": "${name}"`);
        await unloadEvent(name, true);
    }

    event.listener = async (...args) => {
        try {
            const failed = await checks(event.settings, ...args);
            if (failed !== null) return;
            await event.execute(...args);
        } catch (err) {
            error(`Event ${name} (${event.event}): ${err.stack}`);
        }
    };

    client.events.set(name, event);

    info(` Loaded event "${name}" -> ${event.event}`);
}

export async function unloadEvent(name, silent = false) {
    const event = client.events.get(name);
    if (!event) return warn(`Failed unloading event "${name}", not present`);

    client.removeListener(event.event, event.listener);
    event.registered = false;
    client.events.delete(name);

    if (!silent) info(` Unloaded event "${name}"`);
}

export function registerEvent(name) {
    const event = client.events.get(name);

    if (!event) return warn(`Failed registering event "${name}", not loaded`);
    if (event.registered) client.removeListener(event.event, event.listener);
    if (event.once) client.once(event.event, event.listener);
    else client.on(event.event, event.listener);

    event.registered = true;
}

export function registerEvents() {
    for (const name of client.events.keys()) registerEvent(name);
    info(`Registered ${client.events.size} event(s)`);
}

export async function loadEventGroup(group) {
    info(`Loading event group "${group}"`);

    const entries = getEvents(group);
    if (entries == null) return warn(`Missing directory: ./events/${group}`);
    await Promise.all(entries.map(i => loadEvent(i, group)));
}

export async function unloadEventGroup(group) {
    info(`Unloading event group "${group}"`);

    for (const event of [...client.events.values()]) {
        if (event.group !== group) continue;
        await unloadEvent(event.name);
    }
}

export async function loadAllEventGroups(ignoring = true) {
    const groups = getGroups(path.join(__dirname, "events"), ignoring);
    info(`Found event groups: ${groups.join(", ") || "none"}`);

    for (const group of groups) await loadEventGroup(group);
    info(`Loaded all event groups`);
}