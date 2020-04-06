import {Transform} from 'vega-dataflow';
import {inherits} from 'vega-util';

/**
 * Selectively filters tuples by resolving against a filter bitmap.
 * Useful for processing the output of a cross-filter transform.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.ignore - A bit mask indicating which filters to ignore.
 * @param {object} params.filter - The per-tuple filter bitmaps. Typically this
 *   parameter value is a reference to a {@link CrossFilter} transform.
 */
export default function ResolveFilter(params) {
  Transform.call(this, null, params);
}

ResolveFilter.Definition = {
  type: 'ResolveFilter',
  metadata: {},
  params: [
    {name: 'ignore', type: 'number', required: true, description: 'A bit mask indicating which filters to ignore.'},
    {
      name: 'filter',
      type: 'object',
      required: true,
      description: 'Per-tuple filter bitmaps from a CrossFilter transform.'
    }
  ]
};

const prototype = inherits(ResolveFilter, Transform);

prototype.transform = function (_, pulse) {
  const ignore = ~(_.ignore || 0); // bit mask where zeros -> dims to ignore
  const bitmap = _.filter;
  const mask = bitmap.mask;

  // exit early if no relevant filter changes
  if ((mask & ignore) === 0) return pulse.StopPropagation;

  const output = pulse.fork(pulse.ALL);
  const data = bitmap.data();
  const curr = bitmap.curr();
  const prev = bitmap.prev();
  const pass = function (k) {
    return !(curr[k] & ignore) ? data[k] : null;
  };

  // propagate all mod tuples that pass the filter
  output.filter(output.MOD, pass);

  // determine add & rem tuples via filter functions
  // for efficiency, we do *not* populate new arrays,
  // instead we add filter functions applied downstream

  if (!(mask & (mask - 1))) {
    // only one filter changed
    output.filter(output.ADD, pass);
    output.filter(output.REM, function (k) {
      return (curr[k] & ignore) === mask ? data[k] : null;
    });
  } else {
    // multiple filters changed
    output.filter(output.ADD, function (k) {
      const c = curr[k] & ignore;
      const f = !c && c ^ (prev[k] & ignore);
      return f ? data[k] : null;
    });
    output.filter(output.REM, function (k) {
      const c = curr[k] & ignore;
      const f = c && !(c ^ (c ^ (prev[k] & ignore)));
      return f ? data[k] : null;
    });
  }

  // add filter to source data in case of reflow...
  return output.filter(output.SOURCE, function (t) {
    return pass(t._index);
  });
};
