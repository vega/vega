import fetch from 'node-fetch';
import fs from 'fs';
import loaderFactory from './src/loader.js';

export const loader = loaderFactory(
  fetch,
  fs
);

export {
  default as read
} from './src/read.js';

export {
  inferType,
  inferTypes,
  typeParsers
} from './src/type.js';

export {
  format,
  formats,
  responseType
} from './src/formats/index.js';
