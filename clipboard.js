const clipboard = new Map();

export function setClipboard(userId, author, content, createdAt) {
    clipboard.set(userId, {author, content, createdAt});
}

export function getClipboard(userId) {
    return clipboard.get(userId) ?? null;
}

export function clearClipboard(userId) {
    clipboard.delete(userId);
}