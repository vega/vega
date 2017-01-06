import {Literal} from './ast';
import {indexPrefix} from './prefixes';
import {error} from 'vega-util';

export function indata(name, field, value) {
  var index = this.context.data[name]['index:' + field],
      entry = index ? index.value.get(value) : undefined;
  return entry ? entry.count : entry;
}

export function indataVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error('First argument to indata must be a string literal.');
  if (args[1].type !== Literal) error('Second argument to indata must be a string literal.');

  var data = args[0].value,
      field = args[1].value,
      indexName = indexPrefix + field;

  if (!params.hasOwnProperty(indexName)) {
    params[indexName] = scope.getData(data).indataRef(scope, field);
  }
}
