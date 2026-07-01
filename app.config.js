const { name, version } = require('./package.json')

module.exports = ({ config }) => ({
    ...config,
    name,
    slug: name,
    scheme: name,
    version,
})
