import Database from "better-sqlite3";
const db = new Database("data.db");
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    perm INTEGER NOT NULL DEFAULT 1,
    title TEXT DEFAULT "{name}"
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS faqs (
    name TEXT PRIMARY KEY,
    author TEXT NOT NULL,
    added_by TEXT NOT NULL,
    content TEXT NOT NULL
)
`);


db.exec(`
CREATE TABLE IF NOT EXISTS locales (
    name TEXT PRIMARY KEY,
    value TEXT NOT NULL
)
`);

// USERS
const insertUser = db.prepare("INSERT INTO users (id, perm, title) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET perm = excluded.perm, title = excluded.title");
const selectUser = db.prepare("SELECT * FROM users WHERE id = ?");

export function getUser(id) {
    return selectUser.get(id) || { id, perm: 1, title: "{name}" };
}

export function setUser(id, perm, title) {
    const current = getUser(id);
    insertUser.run(id, perm ?? current.perm, title ?? current.title);
}

// FAQS
const insertFAQ = db.prepare("INSERT INTO faqs (name, author, added_by, content) VALUES (?, ?, ?, ?)");
const deleteFAQ = db.prepare("DELETE FROM faqs WHERE name = ?");
const selectFAQ = db.prepare("SELECT * FROM faqs WHERE name = ?");
const searchFAQ = db.prepare("SELECT name FROM faqs WHERE name LIKE ? LIMIT 25");

export function addFAQ(name, author, added_by, content) {
    return insertFAQ.run(name, author, added_by, content);
}

export function delFAQ(name) {
    return deleteFAQ.run(name);
}

export function getFAQ(name) {
    return selectFAQ.get(name) || null;
}

export function searchFAQNames(query) {
    return searchFAQ.all(`%${query}%`);
}

// LOCALES
const insertLocale = db.prepare("INSERT INTO locales (name, value) VALUES (?, ?) ON CONFLICT(name) DO NOTHING");
const updateLocale = db.prepare("UPDATE locales SET value = ? WHERE name = ?");
const deleteLocale = db.prepare("DELETE FROM locales WHERE name = ?");
const selectAllLocales = db.prepare("SELECT * FROM locales");
const searchLocale = db.prepare("SELECT name FROM locales WHERE name LIKE ? LIMIT 25");

const insertManyLocales = db.transaction((entries) => {
    for (const [name, value] of entries) insertLocale.run(name, value);
});

const deleteManyLocales = db.transaction((names) => {
    for (const name of names) deleteLocale.run(name);
});

export function updateLocaleRow(name, value) {
    return updateLocale.run(value, name);
}

export function getAllLocaleRows() {
    return selectAllLocales.all();
}

export function searchLocaleNames(query) {
    return searchLocale.all(`%${query}%`);
}

export function syncLocaleRows(defaults) {
    console.log("Syncing locales in db");

    const defaultKeys = new Set(Object.keys(defaults));
    const existing = selectAllLocales.all();
    const existingKeys = new Set(existing.map(row => row.name));

    const toInsert = [...defaultKeys]
        .filter(name => !existingKeys.has(name))
        .map(name => [name, defaults[name]]);
    const toDelete = [...existingKeys].filter(name => !defaultKeys.has(name));

    if (toInsert.length) insertManyLocales(toInsert);
    if (toDelete.length) deleteManyLocales(toDelete);

    for (const name of toDelete) console.log(`- Deleted "${name}"`);
    for (const [name] of toInsert) console.log(`- Inserted "${name}"`);

    return { added: toInsert.map(([name]) => name), removed: toDelete };
}