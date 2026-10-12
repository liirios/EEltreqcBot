import {Client, Collection, GatewayIntentBits} from "discord.js";
import {getFormatted} from "./locales.js";
import {info, silly} from "./logger.js";
import {crop} from "./utils.js";

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
client.commands = new Collection();
client.events = new Collection();

export async function startBot() {
    info("Launching");
    await client.login(process.env.DISCORD_TOKEN);
    info("Bot is up and running :3");
    silly("Meow");
}

export async function reply(interaction, locale, args, quiet = false) {
    let content = await getFormatted(locale, args);
    content = crop(2000, content);
    return interaction.reply({content, flags: quiet ? 64 : undefined});
}

export async function editReply(interaction, locale, args, quiet = false) {
    let content = await getFormatted(locale, args);
    content = crop(2000, content);
    return interaction.editReply({content, flags: quiet ? 64 : undefined});
}