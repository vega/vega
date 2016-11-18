import Transform from '../Transform';
import {error, inherits} from 'vega-util';

/**
 * Compute rank order scores for tuples. The tuples are assumed to have been
 * sorted in the desired rank order by an upstream data source.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - An accessor for the field to rank.
 * @param {boolean} params.normalize - Boolean flag for normalizing rank values.
 *   If true, the integer rank scores are normalized to range [0, 1].
 */
export default function Rank(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Rank, Transform);

prototype.transform = function(_, pulse) {
  if (!pulse.source) {
    error('Rank transform requires an upstream data source.');
  }

  var norm  = _.normalize,
      field = _.field,
      as = _.as || 'rank',
      ranks = {},
      n = -1, rank;

  if (field) {
    // If we have a field accessor, first compile distinct keys.
    pulse.visit(pulse.SOURCE, function(t) {
      var v = field(t);
      if (ranks[v] == null) ranks[v] = ++n;
    });
    pulse.visit(pulse.SOURCE, norm && --n
      ? function(t) { t[as] = ranks[field(t)] / n; }
      : function(t) { t[as] = ranks[field(t)]; }
    );
  } else {
    n += pulse.source.length;
    rank = -1;
    // Otherwise rank all the tuples together.
    pulse.visit(pulse.SOURCE, norm && n
      ? function(t) { t[as] = ++rank / n; }
      : function(t) { t[as] = ++rank; }
    );
  }

  return pulse.reflow(_.modified()).modifies(as);
};
