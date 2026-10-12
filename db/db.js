import Database from "better-sqlite3";
import { info } from "../logger.js"
import { formatDateTime } from "../utils.js";

export const db = new Database("./db/db.db");
db.pragma("journal_mode = WAL");

class Column {
    constructor(name, type, defaults_to = null, is_nullable = false, is_primary_key = false) {
        this.name = name;
        this.type = type;
        this.defaults_to = defaults_to;
        this.is_nullable = is_nullable;
        this.is_primary_key = is_primary_key;
    }

    getStatement() {
        return `${this.name} ${this.type}${this.is_nullable ? "" : " NOT NULL"}${this.is_primary_key ? " PRIMARY KEY" : ""}${this.defaults_to !== null ? " DEFAULT " + String(this.defaults_to) : ""}`;
    }

    toDB(text) {
        return text;
    }

    fromDB(text) {
        return text;
    }
}

class TextC extends Column {
    constructor(name, defaults_to = null, is_nullable = false, is_primary_key = false) {
        super(name, "TEXT", defaults_to, is_nullable, is_primary_key)
    }
}

class NumericC extends Column {
    constructor(name, defaults_to = null, is_nullable = false, is_primary_key = false) {
        super(name, "NUMERIC", defaults_to, is_nullable, is_primary_key)
    }

    toDB(text) {
        return Number(text);
    }
}

class IntegerC extends Column {
    constructor(name, defaults_to = null, is_nullable = false, is_primary_key = false) {
        super(name, "INTEGER", defaults_to, is_nullable, is_primary_key)
    }

    toDB(text) {
        return Number(text);
    }
}

class RealC extends Column {
    constructor(name, defaults_to = null, is_nullable = false, is_primary_key = false) {
        super(name, "REAL", defaults_to, is_nullable, is_primary_key)
    }

    toDB(text) {
        return Number(text);
    }
}

class DateTimeC extends Column {
    constructor(name, defaults_to = null, is_nullable = false, is_primary_key = false) {
        super(name, "TEXT", defaults_to, is_nullable, is_primary_key)
    }

    toDB(value) {
        const date = value instanceof Date ? value : new Date(value);
        return formatDateTime(date);
    }

    fromDB(text) {
        const [datePart, timePart] = text.split(" ");
        const [dd, mm, yy] = datePart.split("-").map(Number);
        const [hh, min, ss] = timePart.split(":").map(Number);
        return new Date(Date.UTC(2000 + yy, mm - 1, dd, hh, min, ss));
    }
}

class BooleanC extends Column {
    constructor(name, defaults_to = null, is_nullable = false, is_primary_key = false) {
        super(name, "INTEGER", defaults_to, is_nullable, is_primary_key)
    }

    toDB(text) {
        return Number(Boolean(text));
    }

    fromDB(text) {
        return Boolean(Number(text));
    }
}

class Table {
    constructor(name, columns, key, query_key) {
        this.name = name;
        this.key = key;
        this.query_key = query_key;
        this.columns = columns.reduce((a,v) => (a[v.name] = v, a), {});
        this.order = Object.keys(this.columns).filter(e => e !== this.key);
        this.defaults = Object.entries(this.columns).reduce((a, [n, f]) => {
            if (f.defaults_to !== null) a[n] = f.defaults_to;
            return a;
        }, {});
        this.init = `CREATE TABLE IF NOT EXISTS ${this.name} (${columns.map(e => e.getStatement()).join(", ")})`
        db.exec(this.init);
        this.getPREP = db.prepare(`SELECT * FROM ${this.name} WHERE ${this.key} = ?`);
        this.getAllPREP = db.prepare(`SELECT * FROM ${this.name}`);
        this.addPREP = db.prepare(`INSERT INTO ${this.name} (${Object.keys(this.columns).join(", ")}) VALUES (${columns.map(e => "?")})`);
        this.editPREP = db.prepare(`UPDATE ${this.name} SET ${this.order.map(e => e+" = ?").join(", ")} WHERE ${this.key} = ?`);
        this.removePREP = db.prepare(`DELETE FROM ${this.name} WHERE ${this.key} = ?`);
        this.queryPREP = db.prepare(`SELECT * FROM ${this.name} WHERE ${this.query_key} LIKE ? LIMIT ?`);
    }

    get(key, none_default = false) {
        const result = this.getPREP.get(key);
        if (!result) return !none_default ? { [this.key]: key, ...this.defaults } : null;
        this.fromDB(result);
        return result;
    }

    getAll() {
        const result = this.getAllPREP.all();
        if (!result) return null;
        result.forEach(e => this.fromDB(e));
        return result;
    }

    add(key, values) {
        return this.addPREP.run(key, ...Object.values(this.sortNDefault(values, this.defaults)));
    }

    set(key, values) {
        return this.editPREP.run(...Object.values(this.sortNDefault(values, this.defaults)), key);
    }

    update(key, values) {
        const existing = this.get(key, true);
        if (!existing) return this.add(key, values);

        const merged = {};
        this.order.forEach(k => {
            if (Object.keys(values).includes(k) && values[k] !== null) merged[k] = values[k];
            else merged[k] = existing[k];
        });

        this.toDB(merged);
        return this.editPREP.run(...Object.values(merged), key);
    }

    remove(key) {
        return this.removePREP.run(key);
    }
    
    query(query, limit = 25) {
        if (!this.query_key) return null;
        return this.queryPREP.all(`%${query}%`, limit);
    }

    sortNDefault(values, defaults = null) {
        let result = {};
        this.order.forEach(key => {
            if (Object.keys(values).includes(key) && values[key] !== null) result[key] = values[key];
            else if (defaults !== null && Object.keys(defaults).includes(key)) result[key] = defaults[key];
        });
        this.toDB(result);
        return result;
    }

    toDB(result) {
        Object.entries(result).forEach(([key, value]) => {
            result[key] = this.columns[key].toDB(value);
        });
    }

    fromDB(result) {
        Object.entries(result).forEach(([key, value]) => {
            result[key] = this.columns[key].fromDB(value);
        });
    }
}


export const USERS = new Table(
    "users",
    [
        new TextC("id", null, false, true),
        new IntegerC("perm", 1, false, false),
        new TextC("title", `"{name}"`, false, false),
        new BooleanC("limited", false, false, false),
        new BooleanC("quiet", false, false, false)
    ],
    "id",
    null
)

export const SERVERS = new Table(
    "servers",
    [
        new TextC("id", null, false, true),
        new BooleanC("limited", false, false, false),
        new BooleanC("quiet", false, false, false)
    ],
    "id",
    null
)

export const CHANNELS = new Table(
    "channels",
    [
        new TextC("id", null, false, true),
        new BooleanC("limited", false, false, false),
        new BooleanC("quiet", false, false, false)
    ],
    "id",
    null
)

export const LOCALES = new Table(
    "locales",
    [
        new TextC("name", null, false, true),
        new TextC("value", null, false, false)
    ],
    "name",
    "name"
)

export const FAQS = new Table(
    "faqs",
    [
        new TextC("name", null, false, true),
        new TextC("author", null, false, false),
        new TextC("added_by", null, false, false),
        new TextC("content", null, false, false),
        new DateTimeC("timestamp", null, false, false),
        new BooleanC("locked", null, false, false)
    ],
    "name",
    "name"
)


// TODO: move to locales.js
export function syncLocaleRows(defaults) {
    info("Syncing locales in db");

    const defaultKeys = new Set(Object.keys(defaults));
    const existingKeys = new Set(LOCALES.getAll().map(row => row.name));

    const toInsert = [...defaultKeys]
        .filter(name => !existingKeys.has(name))
        .map(name => [name, defaults[name]]);
    const toDelete = [...existingKeys].filter(name => !defaultKeys.has(name));

    if (toInsert.length) toInsert.forEach(e => {LOCALES.add(e[0], { "value": e[1] })});
    if (toDelete.length) toDelete.forEach(e => {LOCALES.remove(e[0])});

    for (const name of toDelete) info(`- Deleted "${name}"`);
    for (const [name] of toInsert) info(`- Inserted "${name}"`);

    return { added: toInsert.map(([name]) => name), removed: toDelete };
}