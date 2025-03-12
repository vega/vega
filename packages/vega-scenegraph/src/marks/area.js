import {area} from '../path/shapes.js';
import {pickArea} from '../util/pickPath.js';
import markMultiItemPath from './markMultiItemPath.js';

export default markMultiItemPath('area', area, pickArea);
