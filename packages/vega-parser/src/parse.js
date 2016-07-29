import parseView from './parsers/view';
import Scope from './Scope';
import defaults from './config';
import {extend} from 'vega-util';

export default function(spec, config) {
  config = config ? extend({}, defaults, config) : defaults;
  return parseView(spec, new Scope(config)).toRuntime();
}
