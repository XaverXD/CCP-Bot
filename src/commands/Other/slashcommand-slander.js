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
                name: 'clear-all',
                description: 'Clear all slander triggers.',
                type: 1, // SUB_COMMAND
                options: []
            },
            {
                name: 'clear',
                description: 'Clear a specific slander trigger by index or trigger word.',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'index',
                        description: 'The index of the trigger to clear (use /slander list to see indices).',
                        type: 4, // INTEGER
                        required: false,
                        min_value: 1
                    },
                    {
                        name: 'word',
                        description: 'A trigger word to find and clear the associated trigger.',
                        type: 3, // STRING
                        required: false
                    }
                ]
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

            case 'clear-all': {
                save({ triggers: [] });
                return interaction.reply({
                    content: '🗑️ All slander triggers have been cleared.',
                    ephemeral: true
                });
            }

            case 'clear': {
                const index = interaction.options.getInteger('index');
                const word = interaction.options.getString('word')?.toLowerCase().trim();
                const data = load();

                if (!data.triggers || data.triggers.length === 0) {
                    return interaction.reply({
                        content: 'No slander triggers configured.',
                        ephemeral: true
                    });
                }

                if (index !== null && word !== undefined) {
                    return interaction.reply({
                        content: 'Please provide either an index OR a trigger word, not both.',
                        ephemeral: true
                    });
                }

                if (index === null && word === undefined) {
                    return interaction.reply({
                        content: 'Please provide either an index or a trigger word.',
                        ephemeral: true
                    });
                }

                if (index !== null) {
                    // Clear by index
                    const indexZeroBased = index - 1;
                    if (indexZeroBased < 0 || indexZeroBased >= data.triggers.length) {
                        return interaction.reply({
                            content: `Invalid index. Please use \`/slander list\` to see available triggers (1-${data.triggers.length}).`,
                            ephemeral: true
                        });
                    }

                    const removedTrigger = data.triggers.splice(indexZeroBased, 1)[0];
                    save(data);

                    return interaction.reply({
                        content: `🗑️ Removed slander trigger: **${removedTrigger.words.join(', ')}**`,
                        ephemeral: true
                    });
                } else {
                    // Clear by word
                    const triggerIndex = data.triggers.findIndex(trigger =>
                        trigger.words.some(triggerWord => triggerWord.toLowerCase() === word)
                    );

                    if (triggerIndex === -1) {
                        return interaction.reply({
                            content: `No trigger found containing the word "${word}". Use \`/slander list\` to see all triggers.`,
                            ephemeral: true
                        });
                    }

                    const removedTrigger = data.triggers.splice(triggerIndex, 1)[0];
                    save(data);

                    return interaction.reply({
                        content: `🗑️ Removed slander trigger containing "${word}": **${removedTrigger.words.join(', ')}**`,
                        ephemeral: true
                    });
                }
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

                // Check if any of the new words already exist in existing triggers
                let existingTriggerIndex = -1;
                for (let i = 0; i < data.triggers.length; i++) {
                    const trigger = data.triggers[i];
                    if (trigger.words.some(existingWord =>
                        words.some(newWord => existingWord.toLowerCase() === newWord)
                    )) {
                        existingTriggerIndex = i;
                        break;
                    }
                }

                if (existingTriggerIndex !== -1) {
                    // Add new words and GIFs to existing trigger
                    const existingTrigger = data.triggers[existingTriggerIndex];

                    // Add new words that don't already exist
                    const newWords = words.filter(word =>
                        !existingTrigger.words.some(existingWord =>
                            existingWord.toLowerCase() === word
                        )
                    );
                    existingTrigger.words.push(...newWords);

                    // Add new GIFs that don't already exist
                    const newGifs = gifs.filter(gif =>
                        !existingTrigger.gifs.some(existingGif => existingGif === gif)
                    );
                    existingTrigger.gifs.push(...newGifs);

                    save(data);

                    return interaction.reply({
                        content: `✅ Updated existing slander trigger with ${newWords.length} new words and ${newGifs.length} new GIFs.`,
                        ephemeral: true
                    });
                } else {
                    // Create new trigger
                    data.triggers.push({ words, gifs });
                    save(data);

                    return interaction.reply({
                        content: `✅ Added new slander trigger with words: ${words.join(', ')}`,
                        ephemeral: true
                    });
                }
            }

            default:
                return interaction.reply({
                    content: 'Unknown subcommand.',
                    ephemeral: true
                });
        }
    }
}).toJSON();