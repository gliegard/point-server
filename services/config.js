var fs = require('fs');
var debug = require('debug')('point-server:config');

var configs;

function init() {
    const filename = process.env.CONFIG_FILE || "./config/micro.json";
    debug("configuration file: " + filename);
    try {
        loadJson(filename);
    } catch (error) {
        console.log("Please define environment variable CONFIG_FILE. Actual: " + filename);
        throw error;
    }
}

function loadJson(filename) {
    data = fs.readFileSync(filename, 'utf8', 'r');
    configs = JSON.parse(data);

    // log config loaded
    for (const key in configs) {
        debug("config loaded: " + key);
    }
}

function print() {
    for (const key in configs) {
        console.log(key)
        console.log(configs[key]);
    }
}

function getConfig(name) {
    return configs[name];
}

function getFirst() {
    for (key in configs)
        return configs[key];
}

module.exports = {
    init,
    loadJson,
    print,
    getConfig,
    getFirst
}