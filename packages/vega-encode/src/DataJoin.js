import {Transform, ingest, tupleid} from 'vega-dataflow';
import {error, fastmap, inherits} from 'vega-util';

/**
 * Joins a set of data elements against a set of visual items.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): object} [params.item] - An item generator function.
 * @param {function(object): *} [params.key] - The key field associating data and visual items.
 */
export default function DataJoin(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(DataJoin, Transform);

function defaultItemCreate() {
  return ingest({});
}

function isExit(t) {
  return t.exit;
}

prototype.transform = function(_, pulse) {
  var df = pulse.dataflow,
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      item = _.item || defaultItemCreate,
      key = _.key || tupleid,
      map = this.value;

  if (!map) {
    pulse = pulse.addAll();
    this.value = map = fastmap().test(isExit);
    map.lookup = function(t) { return map.get(key(t)); };
  }

  if (_.modified('key') || pulse.modified(key)) {
    error('DataJoin does not support modified key function or fields.');
  }

  pulse.visit(pulse.ADD, function(t) {
    var k = key(t),
        x = map.get(k);

    if (x) {
      (x.exit ? (--map.empty, out.add) : out.mod).push(x);
    } else {
      map.set(k, (x = item(t)));
      out.add.push(x);
    }

    x.datum = t;
    x.exit = false;
  });

  pulse.visit(pulse.MOD, function(t) {
    var k = key(t),
        x = map.get(k);

    if (x) {
      x.datum = t;
      out.mod.push(x);
    }
  });

  pulse.visit(pulse.REM, function(t) {
    var k = key(t),
        x = map.get(k);

    if (t === x.datum && !x.exit) {
      out.rem.push(x);
      x.exit = true;
      ++map.empty;
    }
  });

  if (_.clean && map.empty > df.cleanThreshold) df.runAfter(map.clean);

  return out;
};
