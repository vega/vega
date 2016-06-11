import {entry} from '../util';

export default function parseData(data, scope) {
  var ops = [];

  if (data.values) {
    ops.push(entry('Collect', data.values));
  }

  scope.addData(data.name, ops);
  // TODO transforms
}
