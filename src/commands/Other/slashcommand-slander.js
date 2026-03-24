const { ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");
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
                description: 'Clear triggers or remove specific URLs from triggers.',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'url',
                        description: 'URL to remove from trigger(s). If no word/index specified, removes from all triggers containing it.',
                        type: 3, // STRING
                        required: false
                    },
                    {
                        name: 'word',
                        description: 'Specific trigger word to target (optional, for URL removal or complete trigger removal).',
                        type: 3, // STRING
                        required: false
                    },
                    {
                        name: 'index',
                        description: 'Specific trigger index to target (optional, for URL removal or complete trigger removal).',
                        type: 4, // INTEGER
                        required: false,
                        min_value: 1
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
                const url = interaction.options.getString('url')?.trim();
                const word = interaction.options.getString('word')?.toLowerCase().trim();
                const index = interaction.options.getInteger('index');
                const data = load();

                if (!data.triggers || data.triggers.length === 0) {
                    return interaction.reply({
                        content: 'No slander triggers configured.',
                        ephemeral: true
                    });
                }

                // Validation: Cannot specify both word and index
                if (word && index !== null) {
                    return interaction.reply({
                        content: 'Please specify either a word OR an index, not both.',
                        ephemeral: true
                    });
                }

                // Validation: At least one parameter required
                if (!url && !word && index === null) {
                    return interaction.reply({
                        content: 'Please provide a URL to remove, or a word/index to remove a complete trigger.',
                        ephemeral: true
                    });
                }

                if (url) {
                    // URL removal mode
                    let affectedTriggers = [];
                    let totalUrlsRemoved = 0;

                    if (word || index !== null) {
                        // Remove URL from specific trigger
                        let targetTrigger;
                        let targetIndex;

                        if (index !== null) {
                            const indexZeroBased = index - 1;
                            if (indexZeroBased < 0 || indexZeroBased >= data.triggers.length) {
                                return interaction.reply({
                                    content: `Invalid index. Please use \`/slander list\` to see available triggers (1-${data.triggers.length}).`,
                                    ephemeral: true
                                });
                            }
                            targetTrigger = data.triggers[indexZeroBased];
                            targetIndex = indexZeroBased;
                        } else {
                            targetIndex = data.triggers.findIndex(trigger =>
                                trigger.words.some(triggerWord => triggerWord.toLowerCase() === word)
                            );

                            if (targetIndex === -1) {
                                return interaction.reply({
                                    content: `No trigger found containing the word "${word}". Use \`/slander list\` to see all triggers.`,
                                    ephemeral: true
                                });
                            }
                            targetTrigger = data.triggers[targetIndex];
                        }

                        const urlIndex = targetTrigger.gifs.indexOf(url);
                        if (urlIndex === -1) {
                            return interaction.reply({
                                content: `URL not found in the specified trigger. Available URLs: ${targetTrigger.gifs.map(g => `\`${g}\``).join(', ')}`,
                                ephemeral: true
                            });
                        }

                        targetTrigger.gifs.splice(urlIndex, 1);
                        totalUrlsRemoved = 1;

                        // If no URLs left, remove the entire trigger
                        if (targetTrigger.gifs.length === 0) {
                            data.triggers.splice(targetIndex, 1);
                            save(data);
                            return interaction.reply({
                                content: `🗑️ Removed URL and deleted empty trigger: **${targetTrigger.words.join(', ')}**`,
                                ephemeral: true
                            });
                        }

                        affectedTriggers.push(targetTrigger.words.join(', '));
                    } else {
                        // Remove URL from all triggers
                        for (let i = data.triggers.length - 1; i >= 0; i--) {
                            const trigger = data.triggers[i];
                            const urlIndex = trigger.gifs.indexOf(url);

                            if (urlIndex !== -1) {
                                trigger.gifs.splice(urlIndex, 1);
                                totalUrlsRemoved++;

                                // If no URLs left, remove the entire trigger
                                if (trigger.gifs.length === 0) {
                                    data.triggers.splice(i, 1);
                                } else {
                                    affectedTriggers.push(trigger.words.join(', '));
                                }
                            }
                        }

                        if (totalUrlsRemoved === 0) {
                            return interaction.reply({
                                content: `URL not found in any trigger.`,
                                ephemeral: true
                            });
                        }
                    }

                    save(data);

                    if (word || index !== null) {
                        const identifier = index !== null ? `index ${index}` : `word "${word}"`;
                        return interaction.reply({
                            content: `🗑️ Removed URL from trigger (${identifier}). ${affectedTriggers[0] ? `Remaining URLs: ${data.triggers.find(t => t.words.join(', ') === affectedTriggers[0])?.gifs.length || 0}` : ''}`,
                            ephemeral: true
                        });
                    } else {
                        return interaction.reply({
                            content: `🗑️ Removed URL from ${totalUrlsRemoved} trigger${totalUrlsRemoved > 1 ? 's' : ''}. ${affectedTriggers.length > 0 ? `Affected triggers: ${affectedTriggers.join(', ')}` : ''}`,
                            ephemeral: true
                        });
                    }
                } else {
                    // Complete trigger removal mode
                    let targetIndex;

                    if (index !== null) {
                        targetIndex = index - 1;
                        if (targetIndex < 0 || targetIndex >= data.triggers.length) {
                            return interaction.reply({
                                content: `Invalid index. Please use \`/slander list\` to see available triggers (1-${data.triggers.length}).`,
                                ephemeral: true
                            });
                        }
                    } else {
                        targetIndex = data.triggers.findIndex(trigger =>
                            trigger.words.some(triggerWord => triggerWord.toLowerCase() === word)
                        );

                        if (targetIndex === -1) {
                            return interaction.reply({
                                content: `No trigger found containing the word "${word}". Use \`/slander list\` to see all triggers.`,
                                ephemeral: true
                            });
                        }
                    }

                    const removedTrigger = data.triggers.splice(targetIndex, 1)[0];
                    save(data);

                    const identifier = index !== null ? `index ${index}` : `word "${word}"`;
                    return interaction.reply({
                        content: `🗑️ Removed complete slander trigger (${identifier}): **${removedTrigger.words.join(', ')}**`,
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

                const embeds = [];
                let currentEmbed = new EmbedBuilder()
                    .setTitle('📋 Slander Triggers')
                    .setColor(0x0099FF)
                    .setTimestamp();

                let currentDescription = '';

                for (let i = 0; i < data.triggers.length; i++) {
                    const trigger = data.triggers[i];
                    const words = trigger.words.join(', ');
                    const gifs = trigger.gifs.map(g => `\`${g}\``).join(', ');

                    const triggerText = `**${i + 1}.** Words: ${words}\nGIFs: ${gifs}\n\n`;

                    // Check if adding this trigger would exceed embed description limit (4096 chars)
                    if (currentDescription.length + triggerText.length > 4000) {
                        // Add current embed to array and start new one
                        currentEmbed.setDescription(currentDescription.trim());
                        embeds.push(currentEmbed);

                        currentEmbed = new EmbedBuilder()
                            .setTitle(`📋 Slander Triggers (continued)`)
                            .setColor(0x0099FF)
                            .setTimestamp();

                        currentDescription = triggerText;
                    } else {
                        currentDescription += triggerText;
                    }
                }

                // Add the last embed
                if (currentDescription.length > 0) {
                    currentEmbed.setDescription(currentDescription.trim());
                    embeds.push(currentEmbed);
                }

                // Add footer with total count
                embeds[embeds.length - 1].setFooter({
                    text: `Total triggers: ${data.triggers.length}`
                });

                return interaction.reply({
                    embeds: embeds,
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