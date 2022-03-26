const fs = require('fs')
const path = require('path')
const YAML = require('yaml')

const file = fs.readFileSync(path.join(path.resolve(), 'config.yaml'), 'utf8')

module.exports = YAML.parse(file)
