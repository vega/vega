import {Union} from './constants';
import {array, toNumber} from 'vega-util';

/**
 * Resolves selection for use as a scale domain or reads via the API.
 * @param {string} name - The name of the dataset representing the selection
 * @param {string} [op='union'] - The set operation for combining selections.
 *                 One of 'intersect' or 'union' (default).
 * @returns {object} An object of selected fields and values.
 */
export function selectionResolve(name, op) {
  var data = this.context.data[name],
    entries = data ? data.values.value : [],
    resolved = {}, types = {},
    entry, fields, values, unit, field, res, resUnit, type, union,
    n = entries.length, i = 0, j, m;

  // First union all entries within the same unit.
  for (; i < n; ++i) {
    entry = entries[i];
    unit = entry.unit;
    fields = entry.fields;
    values = entry.values;

    for (j = 0, m = fields.length; j < m; ++j) {
      field = fields[j];
      res = resolved[field.field] || (resolved[field.field] = {});
      resUnit = res[unit] || (res[unit] = []);
      types[field.field] = type = field.type.charAt(0);
      union = ops[type + '_union'];
      res[unit] = union(resUnit, array(values[j]));
    }
  }

  // Then resolve fields across units as per the op.
  op = op || Union;
  Object.keys(resolved).forEach(function (field) {
    resolved[field] = Object.keys(resolved[field])
      .map(function (unit) { return resolved[field][unit]; })
      .reduce(function (acc, curr) {
        return acc === undefined ? curr :
          ops[types[field] + '_' + op](acc, curr);
      });
  });

  return resolved;
}

var ops = {
  E_union: function(base, value) {
    if (!base.length) return value;

    var i = 0, n = value.length;
    for (; i<n; ++i) if (base.indexOf(value[i]) < 0) base.push(value[i]);
    return base;
  },

  E_intersect: function(base, value) {
    return !base.length ? value :
      base.filter(function (v) { return value.indexOf(v) >= 0; });
  },

  R_union: function(base, value) {
    var lo = toNumber(value[0]), hi = toNumber(value[1]);
    if (lo > hi) {
      lo = value[1];
      hi = value[0];
    }

    if (!base.length) return [lo, hi];
    if (base[0] > lo) base[0] = lo;
    if (base[1] < hi) base[1] = hi;
    return base;
  },

  R_intersect: function(base, value) {
    var lo = toNumber(value[0]), hi = toNumber(value[1]);
    if (lo > hi) {
      lo = value[1];
      hi = value[0];
    }

    if (!base.length) return [lo, hi];
    if (hi < base[0] || base[1] < lo) {
      return [];
    } else {
      if (base[0] < lo) base[0] = lo;
      if (base[1] > hi) base[1] = hi;
    }
    return base;
  }
};
