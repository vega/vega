import Transform from '../Transform';
import {ingest} from '../Tuple';
import {accessorName, error, inherits} from 'vega-util';
import {mean, min, max, median} from 'd3-array';

var Methods = {
  value: 'value',
  median: median,
  mean: mean,
  min: min,
  max: max
};

var Empty = [];

/**
 * Impute missing values.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to impute.
 * @param {Array<function(object): *>} [params.groupby] - An array of
 *   accessors to determine series within which to perform imputation.
 * @param {Array<function(object): *>} [params.orderby] - An array of
 *   accessors to determine the ordering within a series.
 * @param {string} [method='value'] - The imputation method to use. One of
 *   'value', 'mean', 'median', 'max', 'min'.
 * @param {*} [value=0] - The constant value to use for imputation
 *   when using method 'value'.
 */
export default function Impute(params) {
  Transform.call(this, [], params);
}

var prototype = inherits(Impute, Transform);

function getValue(_) {
  var m = _.method || Methods.value, v;

  if (Methods[m] == null) {
    error('Unrecognized imputation method: ' + m);
  } else if (m === Methods.value) {
    v = _.value !== undefined ? _.value : 0;
    return function() { return v; };
  } else {
    return Methods[m];
  }
}

function getField(_) {
  var f = _.field;
  return function(t) { return t ? f(t) : NaN; };
}

prototype.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ALL),
      impute = getValue(_),
      field = getField(_),
      fName = accessorName(_.field),
      gNames = _.groupby.map(accessorName),
      oNames = _.orderby.map(accessorName),
      groups = partition(pulse.source, _.groupby, _.orderby),
      curr = [],
      prev = this.value,
      m = groups.domain.length,
      group, value, gVals, oVals, g, i, j, l, n, t;

  for (g=0, l=groups.length; g<l; ++g) {
    group = groups[g];
    gVals = group.values;
    value = NaN;

    // add tuples for missing values
    for (j=0; j<m; ++j) {
      if (group[j] != null) continue;
      oVals = groups.domain[j];

      t = {_impute: true};
      for (i=0, n=gVals.length; i<n; ++i) t[gNames[i]] = gVals[i];
      for (i=0, n=oVals.length; i<n; ++i) t[oNames[i]] = oVals[i];
      t[fName] = isNaN(value) ? (value = impute(group, field)) : value;

      curr.push(ingest(t));
    }
  }

  // update pulse with imputed tuples
  if (curr.length) out.add = out.materialize(out.ADD).add.concat(curr);
  if (prev.length) out.rem = out.materialize(out.REM).rem.concat(prev);
  this.value = curr;

  return out;
};

function partition(data, groupby, orderby) {
  var get = function(f) { return f(t); },
      groups = [],
      domain = [],
      oMap = {}, oVals, oKey,
      gMap = {}, gVals, gKey,
      group, i, j, n, t;

  for (i=0, n=data.length; i<n; ++i) {
    t = data[i];

    oKey = (oVals = orderby.map(get)) + '';
    j = oMap[oKey] || (oMap[oKey] = domain.push(oVals));

    gKey = (gVals = groupby ? groupby.map(get) : Empty) + '';
    if (!(group = gMap[gKey])) {
      group = (gMap[gKey] = []);
      groups.push(group);
      group.values = gVals;
    }
    group[j-1] = t;
  }

  return (groups.domain = domain, groups);
}
