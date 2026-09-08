const fs = require('fs');
const path = require('path');
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

module.exports = (client) => {
  client.handleCommands = async (commandFolders, commandsPath) => {
    client.commands = new Map();
    client.commandArray = [];

    for (const folder of commandFolders) {
      const folderPath = path.join(commandsPath, folder);
      const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

      for (const file of commandFiles) {
        const command = require(path.join(folderPath, file));
        client.commands.set(command.data.name, command);
        if (command.data instanceof SlashCommandBuilder) client.commandArray.push(command.data.toJSON());
        else client.commandArray.push(command.data);
      }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: client.commandArray }
    );
  };
};
