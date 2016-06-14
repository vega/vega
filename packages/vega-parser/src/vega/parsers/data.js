import parseTransform from './transform';
import {entry, transform} from '../util';

export default function parseData(data, scope) {
  var ops = [], last;

  if (data.values) {
    last = entry('Collect', data.values);
    ops.push(last);
  }

  // TODO analyze transform metadata to optimize
  if (data.transform) {
    data.transform.forEach(function(tx) {
      ops.push(last = parseTransform(tx, scope));
    });
  }
  if (last.type !== 'Collect') {
    ops.push(transform('Collect', {}));
  }
  ops.push(transform('Sieve', {}));

  scope.addData(data.name, ops);
}
