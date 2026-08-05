import parseView from './parsers/view.js';
import Scope from './Scope.js';
import defaults from './config.js';
import {error, isObject, mergeConfig} from 'vega-util';

export default function(spec, config, options) {
  if (!isObject(spec)) {
    error('Input Vega specification must be an object.');
  }

  config = mergeConfig(defaults(), config, spec.config);
  return parseView(spec, new Scope(config, options)).toRuntime();
}
