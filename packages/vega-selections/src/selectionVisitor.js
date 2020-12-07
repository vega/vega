import {Intersect} from './constants';
import {Literal} from 'vega-expression';
import {error, hasOwnProperty, peek} from 'vega-util';

const DataPrefix = ':';
const IndexPrefix = '@';

export function selectionVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error('First argument to selection functions must be a string literal.');

  const data = args[0].value;
  const op = args.length >= 2 && peek(args).value;
  const field = 'unit';
  const indexName = IndexPrefix + field;
  const dataName = DataPrefix + data;

  // eslint-disable-next-line no-prototype-builtins
  if (op === Intersect && !hasOwnProperty(params, indexName)) {
    params[indexName] = scope.getData(data).indataRef(scope, field);
  }

  // eslint-disable-next-line no-prototype-builtins
  if (!hasOwnProperty(params, dataName)) {
    params[dataName] = scope.getData(data).tuplesRef();
  }
}
