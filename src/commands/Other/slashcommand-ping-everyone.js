const { ChatInputCommandInteraction } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");

module.exports = new ApplicationCommand({
    command: {
        name: 'ping-everyone',
        description: 'Replies with an @everyone mention.',
        type: 1,
        options: []
    },
    options: { 
        cooldown: 500
    },
    /**
     * 
     * @param {DiscordBot} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        await interaction.reply({
            content: '@everyone'
        });
    }  
}).toJSON();