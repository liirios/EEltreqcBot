import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const res = await fetch("https://draconicconlang.github.io/APIs/dialects/DialectLoader.js");
  const loaderCode = await res.text();
  const getDIALECTS = new Function(`
    ${loaderCode}
    return DIALECTS;
  `);

  const DIALECTS = getDIALECTS();
  const DR = await DIALECTS.load("dr_dr");
  Object.assign(globalThis, DR);

  function replaceLetterDiscord(newDiscordList) {
    const chars = Object.values(CHARACTERS.MAP);
    for (let i = 0; i < chars.length; i++) {
      chars[i].letter_discord = i < newDiscordList.length ? newDiscordList[i] : "";
    }
  }

  const newDiscords = [
    "<:t_:1395014425202786386>", "<:c_:1395015072773836892>", "<:k_:1395014778065391667>", "<:q_:1395014503053135922>", "<:Q_:1395015246292194>", "<:__:1395015167422632027>",
    "<:tr:1395014387709907006>", "<:s_:1395018846015852955>", "<:kx:1395014745571987476>", "<:qX:1395014531406762034>", "<:qH:1395014557038022746>", "<:QH:1395015276411621476>",
    "<:d_:1395015056802058312>", "<:z_:1395014250082078770>", "<:g_:1395014897850646650>", "<:f_:1395014923855069285>", "<:th:1395014402004226149>", "<:ll:1395014689771229345>",
    "<:x_:1395014334962208829>", "<:X_:1395015188507267084>", "<:h_:1395014873045274735>", "<:XH:1395015211601100870>", "<:H_:1395015290470797333>", "<:r_:1395014474393583687>",
    "<:l_:1395014711585800212>", "<:e_:1395014978045476944>", "<:ae:1395015103774064751>", "<:y_:1395014314485874718>", "<:a_:1395018584186687571>", "<:o_:1395014600868495360>",
    "<:u_:1395014366511763506>", "<:i_:1395014840963043541>", "<:ee:1395014959481622528>", "<:aa:1395015126322512033>", "<:oo:1395014573010190427>", "<:uu:1395014349130563735>",
    "<:ii:1395014804724518974>", "<:m_:1395014667578904659>", "<:n_:1395014646955769939>", "<:ng_:1395014626369863700>", "<:a_:1395018584186687571><:_pyr:1395015152100708445>",
    "<:o_:1395014600868495360><:_pyr:1395015152100708445>", "<:u_:1395014366511763506><:_pyr:1395015152100708445>", "<:aa:1395015126322512033><:_pyr:1395015152100708445>",
    "<:oo:1395014573010190427><:_pyr:1395015152100708445>", "<:uu:1395014349130563735><:_pyr:1395015152100708445>", "<:Qem:1395015230228136056>", ":seleng:", "<:_pyr:1395015152100708445>"
  ];

  replaceLetterDiscord(newDiscords);

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.commands = new Collection();

  const commands = [];

  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

  for (const file of commandFiles) {
    const command = (await import(path.join(commandsPath, file))).default
      ?? (await import(path.join(commandsPath, file)));
    client.commands.set(command.data.name, command);
    commands.push(command.data);
  }

  client.once(Events.ClientReady, c => {
    console.log(`Ready as ${c.user.tag}`);
  });

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    await command.execute(interaction);
  });

  client.on('error', console.error);
  process.on('unhandledRejection', console.error);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  await client.login(process.env.DISCORD_TOKEN);
}

main();
