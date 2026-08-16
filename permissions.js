import { getUser } from "./db.js";
import { PERMISSIONS } from "./locales.js";

export function getPermName(level) {
    if (level in PERMISSIONS) return PERMISSIONS[level];

    const levels = Object.keys(PERMISSIONS).map(Number).sort((a, b) => a - b);

    let closest = levels[0];
    for (const l of levels) {
        if (l <= level) closest = l;
        else break;
    }

    return PERMISSIONS[closest];
}

export function getPerm(user_id) {
    return getUser(user_id).perm;
}