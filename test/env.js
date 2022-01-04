const fs = require('fs')
const dotenv = require('dotenv')

function overrideEnv(file) {
    const envConfig = dotenv.parse(fs.readFileSync(file))
    for (const k in envConfig) {
      process.env[k] = envConfig[k]
    }

    // delete require cache
    delete require.cache[require.resolve('../app')]
    delete require.cache[require.resolve('../routes/points')]
}

module.exports = {
    overrideEnv
};
