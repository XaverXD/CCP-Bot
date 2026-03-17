const { ChatInputCommandInteraction } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const { info, error, success } = require('../../utils/Console');

module.exports = new ApplicationCommand({
    command: {
        name: 'randomping',
        description: 'Pings one or more random users from the server.',
        type: 1,
        options: [
            {
                name: "message",
                description: "Message to send after the ping(s)",
                type: 3, // STRING
                required: false
            },
            {
                name: "amount",
                description: "Number of random users to ping",
                type: 4, // INTEGER
                required: false,
                min_value: 1
            }
        ]
    },
    options: {
        cooldown: 3000
    },
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const amount = interaction.options.getInteger("amount") ?? 1;
        const message = interaction.options.getString("message");

        let members;
        try {
            members = await interaction.guild.members.fetch();
        } catch (err) {
            error('Error fetching members:', err);
            return interaction.reply({
                content: "Unable to fetch server members due to rate limits. Please try again later.",
                ephemeral: true
            });
        }

        const users = members.filter(
            member => !member.user.bot && member.id !== interaction.user.id
        );

        if (users.size === 0) {
            return interaction.reply({
                content: "No users found to ping.",
                ephemeral: true
            });
        }

        const maxAmount = Math.min(amount, users.size);

        const shuffled = users.map(u => u).sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, maxAmount);

        const mentions = selected.map(u => `<@${u.id}>`).join(" ");

        const content = message
            ? `${mentions} ${message}`
            : `${mentions}`;

        await interaction.reply({
            content: content
        });
    }
}).toJSON();