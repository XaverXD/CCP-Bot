const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const filePath = path.join(process.cwd(), "/data/slanderConfig.yml");

if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, yaml.dump({ triggers: [] }));
}

function load() {
    try {
        const file = fs.readFileSync(filePath, "utf8");
        const data = yaml.load(file);
        return data || { triggers: [] };
    } catch (err) {
        console.error("Error loading slanderConfig.yml:", err);
        return { triggers: [] };
    }
}

function save(data) {
    try {
        fs.writeFileSync(filePath, yaml.dump(data), "utf8");
    } catch (err) {
        console.error("Error saving slanderConfig.yml:", err);
    }
}

module.exports = { load, save, filePath };