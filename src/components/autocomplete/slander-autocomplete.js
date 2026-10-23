const AutocompleteComponent = require("../../structure/AutocompleteComponent");
const { load } = require("../../utils/slanderStore");

module.exports = new AutocompleteComponent({
    commandName: 'slander',
    run: async (client, interaction) => {
        const focused = interaction.options.getFocused(true);

        if (focused.name !== 'trigger') return interaction.respond([]);

        const input = String(focused.value).toLowerCase().trim();
        const { triggers = [] } = load();

        // Match by trigger number or by any of its words, Discord shows at most 25 choices
        const choices = triggers
            .map((trigger, i) => ({ index: i + 1, words: trigger.words || [] }))
            .filter(({ index, words }) =>
                !input ||
                String(index).startsWith(input) ||
                words.some(word => word.toLowerCase().includes(input))
            )
            .slice(0, 25)
            .map(({ index, words }) => {
                const name = `${index}. ${words.join(', ')}`;

                return {
                    name: name.length > 100 ? name.slice(0, 99) + '…' : name,
                    value: index
                };
            });

        await interaction.respond(choices);
    }
}).toJSON();
