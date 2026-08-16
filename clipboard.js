const clipboard = new Map();

export function setClipboard(userId, author, content) {
    clipboard.set(userId, { author, content });
}

export function getClipboard(userId) {
    return clipboard.get(userId) ?? null;
}

export function clearClipboard(userId) {
    clipboard.delete(userId);
}