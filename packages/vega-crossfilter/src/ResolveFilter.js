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
  'type': 'ResolveFilter',
  'metadata': {},
  'params': [
    { 'name': 'ignore', 'type': 'number', 'required': true,
      'description': 'A bit mask indicating which filters to ignore.' },
    { 'name': 'filter', 'type': 'object', 'required': true,
      'description': 'Per-tuple filter bitmaps from a CrossFilter transform.' }
  ]
};

inherits(ResolveFilter, Transform, {
  transform(_, pulse) {
    const ignore = ~(_.ignore || 0), // bit mask where zeros -> dims to ignore
          bitmap = _.filter,
          mask = bitmap.mask;

    // exit early if no relevant filter changes
    if ((mask & ignore) === 0) return pulse.StopPropagation;

    const output = pulse.fork(pulse.ALL),
          data = bitmap.data(),
          curr = bitmap.curr(),
          prev = bitmap.prev(),
          pass = k => !(curr[k] & ignore) ? data[k] : null;

    // propagate all mod tuples that pass the filter
    output.filter(output.MOD, pass);

    // determine add & rem tuples via filter functions
    // for efficiency, we do *not* populate new arrays,
    // instead we add filter functions applied downstream

    if (!(mask & (mask-1))) { // only one filter changed
      output.filter(output.ADD, pass);
      output.filter(output.REM, k =>
        (curr[k] & ignore) === mask ? data[k] : null);

    } else { // multiple filters changed
      output.filter(output.ADD, k => {
        const c = curr[k] & ignore,
              f = !c && (c ^ (prev[k] & ignore));
        return f ? data[k] : null;
      });
      output.filter(output.REM, k => {
        const c = curr[k] & ignore,
              f = c && !(c ^ (c ^ (prev[k] & ignore)));
        return f ? data[k] : null;
      });
    }

    // add filter to source data in case of reflow...
    return output.filter(output.SOURCE, t => pass(t._index));
  }
});
