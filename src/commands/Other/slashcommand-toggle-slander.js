const { ChatInputCommandInteraction } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");

module.exports = new ApplicationCommand({
    command: {
        name: 'toggle-slander',
        description: 'Toggle slander in this channel.',
        type: 1,
        options: []
    },
    options: {
        cooldown: 5000
    },

    /**
     * 
     * @param {DiscordBot} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const channelId = interaction.channel.id;

        const isActive = client.slanderChannels.get(channelId);

        if (isActive) {
            client.slanderChannels.delete(channelId);

            return interaction.reply({
                content: '❌ Slander deactivated.',
                ephemeral: true
            });
        } else {
            client.slanderChannels.set(channelId, true);

            return interaction.reply({
                content: '✅ Slander active.',
                ephemeral: true
            });
        }
    }
}).toJSON();