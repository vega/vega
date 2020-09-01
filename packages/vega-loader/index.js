import loaderFactory from './src/loader';

export const loader = loaderFactory(
  require('node-fetch'),
  require('fs')
);

export {
  default as read
} from './src/read';

export {
  inferType,
  inferTypes,
  typeParsers
} from './src/type';

export {
  format,
  formats,
  responseType
} from './src/formats/index';
