import loaderFactory from './src/loader';

export var loader = loaderFactory(
  typeof fetch !== 'undefined' && fetch, // use built-in fetch API
  null // no file system access
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
  format as format,
  formats as formats
} from './src/formats/index';
