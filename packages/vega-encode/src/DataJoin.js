import {Transform, ingest, tupleid} from 'vega-dataflow';
import {error, fastmap, inherits, isArray} from 'vega-util';

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

  // prevent transient (e.g., hover) requests from
  // cascading across marks derived from marks
  if (isArray(out.encode)) {
    out.encode = null;
  }

  if (map && (_.modified('key') || pulse.modified(key))) {
    error('DataJoin does not support modified key function or fields.');
  }

  if (!map) {
    pulse = pulse.addAll();
    this.value = map = fastmap().test(isExit);
    map.lookup = function(t) { return map.get(key(t)); };
  }

  pulse.visit(pulse.ADD, function(t) {
    var k = key(t),
        x = map.get(k);

    if (x) {
      if (x.exit) {
        map.empty--;
        out.add.push(x);
      } else {
        out.mod.push(x);
      }
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

  if (pulse.changed(pulse.ADD_MOD)) out.modifies('datum');

  if (_.clean && map.empty > df.cleanThreshold) df.runAfter(map.clean);

  return out;
};
