import fs from "fs";
import path from "path";
import {USERS} from "./db/db.js"
import {fileURLToPath, pathToFileURL} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export function formatUser(template, user, member = null, extra = {}) {
    const values = {
        mention: `<@${user.id}>`,
        name: user.globalName,
        nick: user.username,
        id: user.id,
        ...extra
    };

    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return key in values ? values[key] : match;
    });
}

// https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number
export function isNumeric(str) {
    if (typeof str != "string") return false
    return !isNaN(str) && !isNaN(parseFloat(str))
}

export function highlight(words, content) {
  const wordList = [...new Set(words.split(/\s+/).filter(Boolean))];
  if (!wordList.length) return content;

  const escaped = wordList.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(?:${escaped.join("|")})`, "gi");

  return content
    .replace(pattern, m => `**${m}**`)
    .replace(/\*\*(\s+)\*\*/g, "$1");
}

export function crop(maximum, content) {
    if (content.length <= maximum) return content;
    return content.slice(0, maximum-10) + `... +${content.length-maximum}`;
}

export function simpleFilter(array, query, limit = 25) {
  return array.filter((item) => item.toLowerCase().includes(query.toLowerCase())).slice(0, limit);
}

export function getGroups(dir, ignoring = true) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, {withFileTypes: true})
    .filter((d) => d.isDirectory())
    .filter((d) => !ignoring || !fs.existsSync(path.join(dir, d.name, ".ignore")))
    .map((d) => d.name);
}

export function getJSFiles(path) {
  if (!fs.existsSync(path)) return null;
  return fs.readdirSync(path).filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3));
}

export function getQuiet(interaction) {
  let autoquiet = USERS.get(interaction.user.id)?.quiet ?? false;
  let quiet = interaction.options.getBoolean("quiet");
  if (quiet === null) return autoquiet;
  else return quiet;
}

export function getTarget(interaction) {
  return interaction.options.getUser("target") ?? interaction.user;
}

export function formatDateTime(date) {
  const pad = n => String(n).padStart(2, "0");
  const dd = pad(date.getUTCDate());
  const mm = pad(date.getUTCMonth() + 1);
  const yy = pad(date.getUTCFullYear() % 100);
  const hh = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${dd}-${mm}-${yy} ${hh}:${min}:${ss}`;
}

export async function importFile(path) {
  const imported = await import(`${pathToFileURL(path).href}?update=${Date.now()}`);
  return imported.default;
}

export async function checks(settings, ...args) {
  for (const setting of settings ?? []) {
    if (!(await setting.check(...args))) return setting;
  }
  return null;
}