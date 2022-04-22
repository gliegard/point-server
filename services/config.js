const fs = require('fs');
const storeS3 = require("./storeS3");
const debugModule = require("debug");
const debug = debugModule('point-server:config');
const logError = debugModule('point-server:config-error')
const DEFAULT_CONFIG_KEY = "default";

/**
 * @typedef {{
 *   EPT_JSON?: string;
 *   PIVOT_THREEJS?: string;
 *   SURFACE_MAX?: number;
 *   RETURN_URL?: boolean;
 *   S3_DATA_BUCKET?: string;
 *   S3_DATA_FOLDER?: string;
 *   S3_RESULT_BUCKET?: string;
 *   S3_RESULT_FOLDER?: string;
 *   DOWNLOAD_URL?: string;
 *   AUTODISCOVER_DATASETS_FROM_S3?: boolean;
 * }} Config
 */

let cfgs;
// Proxy object allow us to intercept properties access with a custom getter
// Retrieve config value if it exists, default one otherwise
const configs = new Proxy({}, {
    get(_, config) {
        return new Proxy({}, {
            get(target, key, receiver) {
                if (Reflect.has(target, key))
                    return Reflect.get(target, key, receiver);
                const cfg = cfgs[config];
                let val;
                if (cfg && (val = cfg[key]))
                    return val;
                return cfgs[DEFAULT_CONFIG_KEY][key];
            }
        });
    },
    set() {
        throw new Error("Unsupported operation");
    }
});
/** @type {Config & {STATIC_DATASETS?: string[]; DEFAULT_DATASET?: string}} */
const global = configs.default;

function init() {
    const filename = process.env.CONFIG_FILE || "./config/micro.json";
    debug("configuration file: " + filename);
    try {
        loadJson(filename);
    } catch (error) {
        console.log("Please define environment variable CONFIG_FILE to a valid config file. Actual: " + filename);
        throw error;
    }
}

function loadJson(filename) {
    const data = fs.readFileSync(filename, 'utf8', 'r');
    cfgs = JSON.parse(data);
    if (!(DEFAULT_CONFIG_KEY in cfgs))
        throw new Error("Default config (key: " + DEFAULT_CONFIG_KEY + ") not found!");

    // log config loaded
    for (const key in cfgs) {
        debug("config loaded: " + key);
    }
}

function formatDatasetURL(url, dataset) {
    return url.replaceAll("{dataset}", dataset);
}

function retrieveDatasetConf(dataset) {
    dataset = dataset || global.DEFAULT_DATASET || "";
    const conf = configs[dataset];
    return new Promise((resolve, reject) => {
        let datasets = global.STATIC_DATASETS;
        if (datasets && datasets.includes(dataset))
            resolve([conf, dataset]);
        else if (conf.AUTODISCOVER_DATASETS_FROM_S3) {
            storeS3.listFolders(conf.S3_DATA_BUCKET, conf.S3_DATA_FOLDER)
              .then(folders => folders.includes(dataset) ? resolve([conf, dataset]) : reject())
              .catch(err => {
                  logError(err);
                  reject();
              });
        } else
            reject();
    });
}

module.exports = {
    init,
    loadJson,
    formatDatasetURL,
    retrieveDatasetConf,
    /** @type {{[key: string]: Config}} */
    bySource: configs,
    /** @type {Config & {STATIC_DATASETS?: string[]; DEFAULT_DATASET?: string}} */
    global
};
