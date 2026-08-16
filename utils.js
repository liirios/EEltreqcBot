export function format(template, user, member = null, extra = {}) {
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