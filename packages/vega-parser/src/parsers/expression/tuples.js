import {Literal} from './ast';
import {tuplePrefix} from './prefixes';
import {error} from 'vega-util';

export function tuples(name) {
  var data = this.context.data[name];
  return data ? data.values.value : [];
}

export function tuplesVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error('First argument to tuples must be a string literal.');

  var data = args[0].value,
      dataName = tuplePrefix + data;

  if (!params.hasOwnProperty(dataName)) {
    params[dataName] = scope.getData(data).tuplesRef();
  }
}
