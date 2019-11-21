import {max} from 'd3-array';
import {ingest, rederive, Transform} from 'vega-dataflow';
import {identity, inherits, isArray, isFunction} from 'vega-util';
import contours from './util/contours';
import quantize from './util/quantize';

/**
 * Generate isocontours (level sets) based on input raster grid data.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} [params.field] - The field with raster grid
 *   data. If unspecified, the tuple itself is interpreted as a raster grid.
 * @param {Array<number>} [params.thresholds] - Contour threshold array. If
 *   specified, the levels, nice, resolve, and zero parameters are ignored.
 * @param {number} [params.levels] - The desired number of contour levels.
 * @param {boolean} [params.nice] - Boolean flag indicating if the contour
 *   threshold values should be automatically aligned to "nice"
 *   human-friendly values. Setting this flag may cause the number of
 *   thresholds to deviate from the specified levels.
 * @param {string} [params.resolve] - The method for resolving thresholds
 *   across multiple input grids. If 'independent' (the default), threshold
 *   calculation will be performed separately for each grid. If 'shared', a
 *   single set of threshold values will be used for all input grids.
 * @param {boolean} [params.zero] - Boolean flag indicating if the contour
 *   threshold values should include zero.
 * @param {boolean} [params.smooth] - Boolean flag indicating if the contour
 *   polygons should be smoothed using linear interpolation. The default is
 *   true. The parameter is ignored when using density estimation.
 * @param {boolean} [params.scale] - Optional numerical value by which to
 *   scale the output isocontour coordinates. This parameter can be useful
 *   to scale the contours to match a desired output resolution.
 * @param {string} [params.as='contour'] - The output field in which to store
 *   the generated isocontour data (default 'contour').
 */
export default function Isocontour(params) {
  Transform.call(this, null, params);
}

Isocontour.Definition = {
  "type": "Isocontour",
  "metadata": {"generates": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "thresholds", "type": "number", "array": true },
    { "name": "levels", "type": "number" },
    { "name": "nice", "type": "boolean", "default": false },
    { "name": "resolve", "type": "enum", "values": ["shared", "independent"], "default": "independent" },
    { "name": "zero", "type": "boolean", "default": true },
    { "name": "smooth", "type": "boolean", "default": true },
    { "name": "scale", "type": "number", "expr": true },
    { "name": "as", "type": "string", "null": true, "default": "contour" }
  ]
};

var prototype = inherits(Isocontour, Transform);

prototype.transform = function(_, pulse) {
  if (this.value && !pulse.changed() && !_.modified()) {
    return pulse.StopPropagation;
  }

  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      source = pulse.materialize(pulse.SOURCE).source,
      field = _.field || identity,
      contour = contours().smooth(_.smooth !== false),
      tz = _.thresholds || levels(source, field, _),
      as = _.as === null ? null : _.as || 'contour',
      values = [];

  source.forEach(t => {
    const grid = field(t);

    // generate contour paths in GeoJSON format
    const paths = contour.size([grid.width, grid.height])(
      grid.values, isArray(tz) ? tz : tz(grid.values)
    );

    // adjust contour path coordinates as needed
    if (_.scale || grid.x1 || grid.y1 || grid.scale) {
      var s = _.scale;
      paths.forEach(transform(grid, isFunction(s) ? s(t, _) : s));
    }

    // ingest; copy source data properties to output
    paths.forEach(p => {
      values.push(rederive(t, ingest(as != null ? {[as]: p} : p)));
    });
  });

  if (this.value) out.rem = this.value;
  this.value = out.source = out.add = values;

  return out;
};

function levels(values, f, _) {
  const q = quantize(_.levels || 10, _.nice, _.zero !== false);
  return _.resolve !== 'shared'
    ? q
    : q(values.map(t => max(f(t).values)));
}

export function transform(grid, scale) {
  const x1 = grid.x1 || 0,
        y1 = grid.y1 || 0,
        s = scale != null ? scale : (grid.scale || 1);

  function transformPolygon(coordinates) {
    coordinates.forEach(transformRing);
  }

  function transformRing(coordinates) {
    coordinates.forEach(transformPoint);
  }

  function transformPoint(coordinates) {
    coordinates[0] = (coordinates[0] - x1) * s;
    coordinates[1] = (coordinates[1] - y1) * s;
  }

  return function(geometry) {
    geometry.coordinates.forEach(transformPolygon);
    return geometry;
  };
}
