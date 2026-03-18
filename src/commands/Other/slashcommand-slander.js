const { ChatInputCommandInteraction } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const { load, save } = require("../../utils/slanderStore");

module.exports = new ApplicationCommand({
    command: {
        name: 'slander',
        description: 'Manage slander triggers and channel/server settings.',
        type: 1,
        options: [
            {
                name: 'toggle',
                description: 'Toggle slander in this channel or globally for the server.',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'global',
                        description: 'Set slander globally for the entire server (default: false, channel only).',
                        type: 5, // BOOLEAN
                        required: false
                    }
                ]
            },
            {
                name: 'clear',
                description: 'Clear all slander triggers.',
                type: 1, // SUB_COMMAND
                options: []
            },
            {
                name: 'list',
                description: 'List all slander triggers.',
                type: 1, // SUB_COMMAND
                options: []
            },
            {
                name: 'add',
                description: 'Add a new slander trigger.',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'words',
                        description: 'Comma-separated list of trigger words.',
                        type: 3, // STRING
                        required: true
                    },
                    {
                        name: 'gifs',
                        description: 'Comma-separated list of Image/GIF URLs.',
                        type: 3, // STRING
                        required: true
                    }
                ]
            }
        ]
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
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'toggle': {
                const global = interaction.options.getBoolean('global') ?? false;
                const guildId = interaction.guild.id;

                if (global) {
                    const isActive = client.slanderServers?.get(guildId);

                    if (isActive) {
                        client.slanderServers.delete(guildId);
                        return interaction.reply({
                            content: '❌ Slander deactivated globally.',
                            ephemeral: true
                        });
                    } else {
                        if (!client.slanderServers) client.slanderServers = new Map();
                        client.slanderServers.set(guildId, true);
                        return interaction.reply({
                            content: '✅ Slander activated globally for the server.',
                            ephemeral: true
                        });
                    }
                } else {
                    const channelId = interaction.channel.id;
                    const isActive = client.slanderChannels.get(channelId);

                    if (isActive) {
                        client.slanderChannels.delete(channelId);
                        return interaction.reply({
                            content: '❌ Slander deactivated in this channel.',
                            ephemeral: true
                        });
                    } else {
                        client.slanderChannels.set(channelId, true);
                        return interaction.reply({
                            content: '✅ Slander activated in this channel.',
                            ephemeral: true
                        });
                    }
                }
            }

            case 'clear': {
                save({ triggers: [] });
                return interaction.reply({
                    content: '🗑️ All slander triggers have been cleared.',
                    ephemeral: true
                });
            }

            case 'list': {
                const data = load();
                if (!data.triggers || data.triggers.length === 0) {
                    return interaction.reply({
                        content: 'No slander triggers configured.',
                        ephemeral: true
                    });
                }

                const triggersList = data.triggers.map((trigger, index) => {
                    const words = trigger.words.join(', ');
                    const gifs = trigger.gifs.join(', ');
                    return `**${index + 1}.** Words: ${words}\nGIFs: \`${gifs}\``;
                }).join('\n\n');

                return interaction.reply({
                    content: `📋 **Slander Triggers:**\n\n${triggersList}`,
                    ephemeral: true
                });
            }

            case 'add': {
                const wordsStr = interaction.options.getString('words');
                const gifsStr = interaction.options.getString('gifs');

                const words = wordsStr.split(',').map(w => w.trim().toLowerCase()).filter(w => w);
                const gifs = gifsStr.split(',').map(g => g.trim()).filter(g => g);

                if (words.length === 0 || gifs.length === 0) {
                    return interaction.reply({
                        content: 'Please provide at least one word and one GIF URL.',
                        ephemeral: true
                    });
                }

                const data = load();
                data.triggers.push({ words, gifs });
                save(data);

                return interaction.reply({
                    content: `✅ Added new slander trigger with words: ${words.join(', ')}`,
                    ephemeral: true
                });
            }

            default:
                return interaction.reply({
                    content: 'Unknown subcommand.',
                    ephemeral: true
                });
        }
    }
}).toJSON();