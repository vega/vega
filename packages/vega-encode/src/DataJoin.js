import get from './get';
import {Transform, ingest, tupleid} from 'vega-dataflow';
import {error, inherits} from 'vega-util';

/**
 * Joins a set of data elements against a set of visual items.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): object} [params.item] - An item generator function.
 * @param {function(object): *} [params.key] - The key field associating data and visual items.
 */
export default function DataJoin(params) {
  Transform.call(this, {}, params);
}

var prototype = inherits(DataJoin, Transform);

function defaultItemCreate() {
  return ingest({});
}

prototype.transform = function(_, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      item = _.item || defaultItemCreate,
      key = _.key || tupleid,
      map = this.value;

  if (_.modified('key') || pulse.modified(key)) {
    // TODO: support re-keying?
    error('DataJoin does not support modified key function or fields.');
  }

  pulse.visit(pulse.ADD, function(t) {
    var k = key(t),
        x = get(map, k);

    if (x) {
      (x.exit ? out.add : out.mod).push(x);
    } else {
      map[k] = (x = item(t));
      out.add.push(x);
    }

    x.datum = t;
    x.exit = false;
  });

  pulse.visit(pulse.MOD, function(t) {
    var k = key(t),
        x = get(map, k);

    if (x) {
      out.mod.push(x);
    }
  });

  pulse.visit(pulse.REM, function(t) {
    var k = key(t),
        x = get(map, k);

    if (t === x.datum) {
      out.rem.push(x);
      x.exit = true;
    }
  });

  return out;
};
