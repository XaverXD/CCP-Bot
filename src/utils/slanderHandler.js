const { load } = require("./slanderStore");

module.exports = async (message) => {
    const content = message.content.toLowerCase();

    const { triggers } = load();

    for (const entry of triggers) {
        if (!entry.words || entry.words.length === 0) continue;

        const matched = entry.words.some(word => content.includes(word.toLowerCase()));

        if (matched) {
            if (!entry.gifs || entry.gifs.length === 0) return;

            const randomGif = entry.gifs[Math.floor(Math.random() * entry.gifs.length)];

            try {
                await message.reply({ content: randomGif });
            } catch (err) {
                console.error(err);
            }

            break;
        }
    }
};