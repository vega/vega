import loaderFactory from './src/loader.js';

export const loader = loaderFactory(
  null // no file system access
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
