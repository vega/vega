import {Transform, ingest} from 'vega-dataflow';
import {inherits, isFunction} from 'vega-util';
import {geoGraticule} from 'd3-geo';

/**
 * GeoJSON feature generator for creating graticules.
 * @constructor
 */
export default function Graticule(params) {
  Transform.call(this, [], params);
  this.generator = geoGraticule();
}

var prototype = inherits(Graticule, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse.fork(),
      src = this.value,
      gen = this.generator, t;

  if (!src.length || _.modified()) {
    for (var prop in _) {
      if (isFunction(gen[prop])) {
        gen[prop](_[prop]);
      }
    }
  }

  t = gen();
  if (src.length) {
    t._id = src[0]._id;
    out.mod.push(t);
  } else {
    out.add.push(ingest(t));
  }
  src[0] = t;

  return out.source = src, out;
};
