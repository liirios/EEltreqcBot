const LIMITED_SERVERS = [
    "1315098863694250075"
] // TODO: Move somewhere into db for runtime editing

const LIMITED_CHANNELS = [

] // TODO: Move somewhere into db for runtime editing

const UNRESTRICTED_PERM = 2; // TODO: Move somewhere into db for runtime editing

export function isLimited(interaction, perm) {// TODO: Add channel limiting
    return perm => UNRESTRICTED_PERM || !(interaction.guildId === SERVER_LIMITED)
}

