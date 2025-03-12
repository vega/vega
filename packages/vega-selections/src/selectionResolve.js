import {intersection, union} from 'd3-array';
import {array, toNumber} from 'vega-util';
import {$selectionId, And, Or, SelectionId, Union, VlMulti, VlPoint} from './util.js';

/**
 * Resolves selection for use as a scale domain or reads via the API.
 * @param {string} name - The name of the dataset representing the selection
 * @param {string} [op='union'] - The set operation for combining selections.
 *                 One of 'intersect' or 'union' (default).
 * @param {boolean} isMulti - Identifies a "multi" selection to perform more
 *                 expensive resolution computation.
 * @param {boolean} vl5 - With Vega-Lite v5, "multi" selections are now called "point"
 *                 selections, and thus the resolved tuple should reflect this name.
 *                 This parameter allows us to reflect this change without triggering
 *                 a major version bump for Vega.
 * @returns {object} An object of selected fields and values.
 */
export function selectionResolve(name, op, isMulti, vl5) {
  var data = this.context.data[name],
    entries = data ? data.values.value : [],
    resolved = {}, multiRes = {}, types = {},
    entry, fields, values, unit, field, value, res, resUnit, type, union,
    n = entries.length, i = 0, j, m;

  // First union all entries within the same unit.
  for (; i < n; ++i) {
    entry = entries[i];
    unit = entry.unit;
    fields = entry.fields;
    values = entry.values;

    if (fields && values) { // Intentional selection stores
      for (j = 0, m = fields.length; j < m; ++j) {
        field = fields[j];
        res = resolved[field.field] || (resolved[field.field] = {});
        resUnit = res[unit] || (res[unit] = []);
        types[field.field] = type = field.type.charAt(0);
        union = ops[`${type}_union`];
        res[unit] = union(resUnit, array(values[j]));
      }

      // If the same multi-selection is repeated over views and projected over
      // an encoding, it may operate over different fields making it especially
      // tricky to reliably resolve it. At best, we can de-dupe identical entries
      // but doing so may be more computationally expensive than it is worth.
      // Instead, for now, we simply transform our store representation into
      // a more human-friendly one.
      if (isMulti) {
        resUnit = multiRes[unit] || (multiRes[unit] = []);
        resUnit.push(array(values).reduce((obj, curr, j) => (obj[fields[j].field] = curr, obj), {}));
      }
    } else {  // Short circuit extensional selectionId stores which hold sorted IDs unique to each unit.
      field = SelectionId;
      value = $selectionId(entry);
      res = resolved[field] || (resolved[field] = {});
      resUnit = res[unit] || (res[unit] = []);
      resUnit.push(value);

      if (isMulti) {
        resUnit = multiRes[unit] || (multiRes[unit] = []);
        resUnit.push({[SelectionId]: value});
      }
    }
  }

  // Then resolve fields across units as per the op.
  op = op || Union;
  if (resolved[SelectionId]) {
    resolved[SelectionId] = ops[`${SelectionId}_${op}`](...Object.values(resolved[SelectionId]));
  } else {
    Object.keys(resolved).forEach(field => {
      resolved[field] = Object.keys(resolved[field])
        .map(unit => resolved[field][unit])
        .reduce((acc, curr) => acc === undefined ? curr : ops[`${types[field]}_${op}`](acc, curr));
    });
  }

  entries = Object.keys(multiRes);
  if (isMulti && entries.length) {
    const key = vl5 ? VlPoint : VlMulti;
    resolved[key] = op === Union
      ? {[Or]: entries.reduce((acc, k) => (acc.push(...multiRes[k]), acc), [])}
      : {[And]: entries.map(k => ({[Or]: multiRes[k]}))};
  }

  return resolved;
}

var ops = {
  [`${SelectionId}_union`]: union,
  [`${SelectionId}_intersect`]: intersection,

  E_union: function(base, value) {
    if (!base.length) return value;

    var i = 0, n = value.length;
    for (; i<n; ++i) if (!base.includes(value[i])) base.push(value[i]);
    return base;
  },

  E_intersect: function(base, value) {
    return !base.length ? value :
      base.filter(v => value.includes(v));
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
