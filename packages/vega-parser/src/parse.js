import parseView from './parsers/view';
import Scope from './Scope';
import defaults from './config';

export default function(spec, config) {
  return parseView(spec, new Scope(defaults(config || spec.config)))
    .toRuntime();
}
