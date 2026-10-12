import daggy from "daggy";
import { getPerm } from "./permissions.js";

export const Result = daggy.taggedSum("Result", {
    OK: [],
    ERROR: ["error"],
    CUSTOM: ["message"],
    NO_PERM: ["required", "reverse"],
    COOLDOWN: ["uses", "remaining"],
    OK_COOLDOWN_USE: [],
    OK_COOLDOWN_FORCE: ["uses", "remaining"],
    UNIMPL: []
})

export const Setting = daggy.taggedSum("Setting", {
    PERM: ["required", "reverse"],
    SERVER: ["ids", "reverse"],
    CHANNEL: ["ids", "reverse"],
    USER: ["ids", "reverse"],
    COOLDOWN: ["uses", "remaining"]
})

Setting.prototype.validate = function() {
    if (typeof this?.reverse !== "boolean") return false; 
    return this.cata({
        PERM: (required) => Number.isInteger(required),
        SERVER: (ids) => Array.isArray(ids),
        CHANNEL: (ids) => Array.isArray(ids),
        USER: (ids) => Array.isArray(ids),
        COOLDOWN: (uses, remaining) => Number.isInteger(uses) && Number.isInteger(remaining)
    });
};

Setting.prototype.check = function(obj) {
    const user = obj?.user ?? obj?.author ?? obj?.member?.user ?? null;
    const guildId = obj?.guildId ?? obj?.guild?.id ?? obj?.member?.guild?.id ?? null;
    const channelId = obj?.channelId ?? obj?.channel?.id ?? null;

    return this.cata({
        PERM: (required, reverse) => user ? (getPerm(user.id) >= required) !== reverse : false,
        SERVER: (ids, reverse) => ids.includes(guildId) !== reverse,
        CHANNEL: (ids, reverse) => ids.includes(channelId) !== reverse,
        USER: (ids, reverse) => ids.includes(user?.id) !== reverse,
        COOLDOWN: (uses, remaining) => true // TODO: EDITTTTTTTTTTTTT
    });
};

Setting.prototype.denial = function() {
    return setting.cata({
        PERM: (required, reverse) => Result.NO_PERM(required, reverse),
        SERVER: () => Result.CUSTOM("This command can't be used in this server."),
        CHANNEL: () => Result.CUSTOM("This command can't be used in this channel."),
        USER: () => Result.CUSTOM("You can't use this command."),
        COOLDOWN: (uses, remaining) => Result.COOLDOWN(remaining) // TODO: EDITTTTTTTTTTTTT
    });
}

export const Option = Object.freeze({
    QUIET: {name: "quiet", description: "Ephemeral", type: 5},
    KEY: {name: "key", description: "Key", type: 3, required: true},
    KEY_AUTO: {name: "key", description: "Key", type: 3, required: true, autocomplete: true},
    VALUE: {name: "value", description: "Value", type: 3, required: true},
    VALUE_OPTIONAL: {name: "value", description: "Value", type: 3},
    BOOLEAN: {name: "boolean", description: "Boolean", type: 5, required: true},
    TARGET: {name: "target", description: "Target", type: 6, required: true},
    STATUSES: [
        {name: "Online", value: "online"},
        {name: "Idle", value: "idle"},
        {name: "Do Not Disturb", value: "dnd"},
        {name: "Invisible", value: "invisible"}
    ],
    TYPES: [
        {name: "Playing", value: 0},
        {name: "Listening", value: 2},
        {name: "Watching", value: 3},
    ]
})