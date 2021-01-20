const fs = require('fs');
const dir = require('path').dirname(require.resolve('vega-schema'));
const name = '/vega-schema.json';
const file = dir + name;

// copy JSON schema to local build folder
fs.createReadStream(file).pipe(fs.createWriteStream('build' + name));
