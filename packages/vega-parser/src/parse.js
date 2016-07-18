import parseView from './parsers/view';
import Scope from './Scope';

export default function parse(spec) {
  var scope = new Scope();
  parseView(spec, scope);
  return scope.toRuntime();
}
