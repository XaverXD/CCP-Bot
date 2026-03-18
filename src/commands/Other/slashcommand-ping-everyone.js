const { ChatInputCommandInteraction, PermissionFlagsBits } = require("discord.js");
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
        // Ensure only members with the MentionEveryone permission can use this command
        if (
            !interaction.memberPermissions ||
            !interaction.memberPermissions.has(PermissionFlagsBits.MentionEveryone)
        ) {
            await interaction.reply({
                content: 'You do not have permission to mention everyone.',
                ephemeral: true
            });
            return;
        }

        await interaction.reply({
            content: '@everyone'
        });
    }  
}).toJSON();