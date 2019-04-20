import parseView from './parsers/view';
import Scope from './Scope';
import defaults from './config';
import {error, isObject} from 'vega-util';

export default function(spec, config) {
  if (!isObject(spec)) error('Input Vega specification must be an object.');
  return parseView(spec, new Scope(defaults([config, spec.config])))
    .toRuntime();
}
