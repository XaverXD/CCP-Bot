const Event = require("../../structure/Event");
const slanderHandler = require("../../utils/slanderHandler");

module.exports = new Event({
    event: 'messageCreate',
    once: false,

    run: async (client, message) => {
        if (message.author.bot) return;

        await slanderHandler(message);
    }
}).toJSON();