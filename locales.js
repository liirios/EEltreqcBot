import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { updateLocaleRow, getAllLocaleRows, syncLocaleRows } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export let DEFAULT_LOCALES = {};
export let LOCALES = {};

export const PERMISSIONS = {
    0: "Blocked",
    1: "User",
    2: "Trusted",
    3: "Admin",
    4: "Owner"
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

export function format(string, args = {}) {
    if (string == null) return "";
    return String(string).replace(/\{(\w+)\}/g, (match, key) => {
        const value = args[key];
        return value !== undefined && value !== null ? String(value) : match;
    });
}

export function getFormatted(id, args = {}) {
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