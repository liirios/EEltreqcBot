import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Liquid } from "liquidjs";
import { updateLocaleRow, getAllLocaleRows, syncLocaleRows } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export let DEFAULT_LOCALES = {};
export let LOCALES = {};

export const PERMISSIONS = {
    "-214748369": "1ue apparently",
    "-1": "WHAT DID YOU DO??????",
    0: "Blocked",
    1: "User",
    2: "Trusted",
    3: "Admin",
    4: "Owner",
    2147483647: "Uhhh"
}; // TODO: Move into locales db for runtime editing

export const OPTION_TYPES = {
    1: "Subcommand",
    2: "Subcommand Group",
    3: "String",
    4: "Integer",
    5: "Boolean",
    6: "User",
    7: "Channel",
    8: "Role",
    9: "Mentionable",
    10: "Number",
    11: "Attachment"
};

export const INTEGRATION_TYPES = {
    0: "Guild Install",
    1: "User Install"
};

export const CONTEXT_TYPES = {
    0: "Guild",
    1: "Bot DM",
    2: "Private Channel"
};

const engine = new Liquid();

engine.registerFilter("random", (input) => {
    const parts = String(input).split("|");
    return parts[Math.floor(Math.random() * parts.length)];
});

export function registerLocaleFilter(name, fn) {
    engine.registerFilter(name, fn);
}

export function loadDefaultLocales(locales_path) {
    console.log(`Loading default locales from ${locales_path}`)
    DEFAULT_LOCALES = JSON.parse(fs.readFileSync(path.join(__dirname, locales_path), "utf-8"));
}

export function syncLocales() {
    syncLocaleRows(DEFAULT_LOCALES);
    for (const row of getAllLocaleRows()) LOCALES[row.name] = row.value;
}

export function getLocale(id) {
    return Object.prototype.hasOwnProperty.call(LOCALES, id) ? LOCALES[id] : id;
}

export async function format(string, args = {}) {
    if (string == null) return "";
    try {
        return await engine.parseAndRender(String(string), args);
    } catch (e) {
        console.error(`Locale format error for "${string}":`, e);
        return String(string);
    }
}

export async function getFormatted(id, args = {}) {
    return format(getLocale(id), args);
}

export function setLocale(name, value) {
    updateLocaleRow(name, value);
    LOCALES[name] = value;
    return value;
}

export function resetLocale(name) {
    return setLocale(name, DEFAULT_LOCALES[name]);
}

export function getAllLocales() {
    return { ...LOCALES };
}