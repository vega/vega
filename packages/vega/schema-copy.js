import fs from 'fs';
import { dirname } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = dirname(require.resolve('vega-schema'));
const name = '/vega-schema.json';
const file = dir + name;

// copy JSON schema to local build folder
fs.createReadStream(file).pipe(fs.createWriteStream('build' + name));
