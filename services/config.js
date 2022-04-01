var fs = require('fs');

var configs;

// const KEY_EPT_JSON = "EPT_JSON";
// const KEY_PIVOT_THREEJS = "PIVOT_THREEJS";
// const KEY_SURFACE_MAX = "SURFACE_MAX";
// const KEY_STORE_READ_URL = "STORE_READ_URL";
// const KEY_STORE_WRITE_URL = "STORE_WRITE_URL";
// const KEY_RETURN_URL = "RETURN_URL";

function init() {
    const filename = process.env.CONFIG_FILE;
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