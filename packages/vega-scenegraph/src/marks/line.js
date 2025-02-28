import {line} from '../path/shapes.js';
import {pickLine} from '../util/pickPath.js';
import markMultiItemPath from './markMultiItemPath.js';

export default markMultiItemPath('line', line, pickLine);
