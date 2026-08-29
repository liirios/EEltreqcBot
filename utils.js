import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

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

export function getCommandGroups() {
  const dir = path.join(__dirname, "commands");
  return fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

export function getCommands(group) {
  const dir = path.join(__dirname, "commands", group);
  if (!fs.existsSync(dir)) return null;
  return fs.readdirSync(dir).filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3));
}