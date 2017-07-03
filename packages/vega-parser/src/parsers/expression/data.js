import {Literal} from './ast';
import {dataPrefix, indexPrefix} from './prefixes';
import {error, truthy} from 'vega-util';

export function data(name) {
  var data = this.context.data[name];
  return data ? data.values.value : [];
}

export function dataVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) {
    error('First argument to data functions must be a string literal.');
  }

  var data = args[0].value,
      dataName = dataPrefix + data;

  if (!params.hasOwnProperty(dataName)) {
    params[dataName] = scope.getData(data).tuplesRef();
  }
}

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

export function setdata(name, tuples) {
  var df = this.context.dataflow,
      data = this.context.data[name],
      input = data.input;

  df.pulse(input, df.changeset().remove(truthy).insert(tuples));
  return 1;
}
