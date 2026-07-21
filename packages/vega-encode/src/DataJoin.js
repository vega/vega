import {Transform, ingest, tupleid, visitChunked} from 'vega-dataflow';
import {error, fastmap, inherits, isArray} from 'vega-util';

const SCHEDULING_BATCH = 512;

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

function defaultItemCreate() {
  return ingest({});
}

function newMap(key) {
  const map = fastmap().test(t => t.exit);
  map.lookup = t => map.get(key(t));
  return map;
}

function collect(pulse, flags) {
  const tuples = [];
  pulse.visit(flags, t => { tuples.push(t); });
  return tuples;
}

async function joinChunked(pulse, scheduler, visit) {
  await visitChunked(collect(pulse, pulse.ADD), visit.add, scheduler, SCHEDULING_BATCH);
  await visitChunked(collect(pulse, pulse.MOD), visit.mod, scheduler, SCHEDULING_BATCH);
  await visitChunked(collect(pulse, pulse.REM), visit.rem, scheduler, SCHEDULING_BATCH);
  return visit.finish();
}

inherits(DataJoin, Transform, {
  transform(_, pulse) {
    var df = pulse.dataflow,
        out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
        item = _.item || defaultItemCreate,
        key = _.key || tupleid,
        map = this.value,
        scheduler = df._scheduler;

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
      this.value = map = newMap(key);
    }

    const visit = {
      add(t) {
        const k = key(t);
        let x = map.get(k);

        if (x) {
          if (x.exit) {
            map.empty--;
            out.add.push(x);
          } else {
            out.mod.push(x);
          }
        } else {
          x = item(t);
          map.set(k, x);
          out.add.push(x);
        }

        x.datum = t;
        x.exit = false;
      },

      mod(t) {
        const k = key(t),
              x = map.get(k);

        if (x) {
          x.datum = t;
          out.mod.push(x);
        }
      },

      rem(t) {
        const k = key(t),
              x = map.get(k);

        if (t === x.datum && !x.exit) {
          out.rem.push(x);
          x.exit = true;
          ++map.empty;
        }
      },

      finish() {
        if (pulse.changed(pulse.ADD_MOD)) out.modifies('datum');

        if (pulse.clean() || _.clean && map.empty > df.cleanThreshold) {
          df.runAfter(map.clean);
        }

        return out;
      }
    };

    if (scheduler && !pulse.pulses &&
        pulse.add.length + pulse.mod.length + pulse.rem.length > SCHEDULING_BATCH) {
      return joinChunked(pulse, scheduler, visit);
    }

    pulse.visit(pulse.ADD, visit.add);
    pulse.visit(pulse.MOD, visit.mod);
    pulse.visit(pulse.REM, visit.rem);

    return visit.finish();
  }
});
