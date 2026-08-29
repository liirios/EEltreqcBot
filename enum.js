function variant() {
    const f = (arg) => { f.arg = arg; return f; };
    return f;
}

export const InteractionResponse = Object.freeze({
    OK: variant(),
    ERROR: variant(),
    UNIMPL: variant(),
    NO_PERM: variant(),
    COOLDOWN: variant(), // currently unused
    CUSTOM: variant()
});

export const InteractionOption = Object.freeze({
    QUIET: { name: "quiet", description: "Ephemeral", type: 5 },
    KEY_AUTO: { name: "key", description: "Key", type: 3, required: true, autocomplete: true },
    KEY: { name: "key", description: "Key", type: 3, required: true},
    VALUE: { name: "value", description: "value", type: 3, required: true},
    USER: { name: "user", description: "User", type: 6, required: true },
})