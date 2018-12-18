const fs = require('fs'),
      dir = require('path').dirname(require.resolve('vega-schema')),
      name = '/vega-schema.json',
      file = dir + name;

// copy JSON schema to local build folder
fs.createReadStream(file).pipe(fs.createWriteStream('build' + name));
