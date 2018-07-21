import {inrange} from './arrays';
import {Literal} from './ast';
import {dataVisitor} from './data';
import {indexPrefix} from './prefixes';
import {array, error, field, isArray, isDate, toNumber} from 'vega-util';

var TYPE_ENUM = 'E',
    TYPE_RANGE_INC = 'R',
    TYPE_RANGE_EXC = 'R-E',
    TYPE_RANGE_LE = 'R-LE',
    TYPE_RANGE_RE = 'R-RE',
    INTERSECT = 'intersect',
    UNION = 'union',
    UNIT_INDEX = 'index:unit';

// TODO: revisit date coercion?
function testPoint(datum, entry) {
  var fields = entry.fields,
      values = entry.values,
      n = fields.length,
      i = 0, dval, f;

  for (; i<n; ++i) {
    f = fields[i];
    f.getter = field.getter || field(f.field);
    dval = f.getter(datum);

    if (isDate(dval)) dval = toNumber(dval);
    if (isDate(values[i])) values[i] = toNumber(values[i]);
    if (isDate(values[i][0])) values[i] = values[i].map(toNumber);

    if (f.type === TYPE_ENUM) {
      // Enumerated fields can either specify individual values (single/multi selections)
      // or an array of values (interval selections).
      if(isArray(values[i]) ? values[i].indexOf(dval) < 0 : dval !== values[i]) {
        return false;
      }
    } else {
      if (f.type === TYPE_RANGE_INC) {
        if (!inrange(dval, values[i])) return false;
      } else if (f.type === TYPE_RANGE_RE) {
        // Discrete selection of bins test within the range [bin_start, bin_end).
        if (!inrange(dval, values[i], true, false)) return false;
      } else if (f.type === TYPE_RANGE_EXC) { // 'R-E'/'R-LE' included for completeness.
        if (!inrange(dval, values[i], false, false)) return false;
      } else if (f.type === TYPE_RANGE_LE) {
        if (!inrange(dval, values[i], false, true)) return false;
      }
    }
  }

  return true;
}

/**
 * Tests if a tuple is contained within an interactive selection.
 * @param {string} name - The name of the data set representing the selection.
 *                 Tuples in the dataset are of the form
 *                 {unit: string, fields: array<fielddef>, values: array<*>}.
 *                 Fielddef is of the form
 *                 {field: string, channel: string, type: 'E' | 'R'} where
 *                 'type' identifies whether tuples in the dataset enumerate
 *                 values for the field, or specify a continuous range.
 * @param {object} datum - The tuple to test for inclusion.
 * @param {string} op - The set operation for combining selections.
 *   One of 'intersect' or 'union' (default).
 * @return {boolean} - True if the datum is in the selection, false otherwise.
 */
export function vlSelectionTest(name, datum, op) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      unitIdx = data ? data[UNIT_INDEX] && data[UNIT_INDEX].value : undefined,
      intersect = op === INTERSECT,
      n = entries.length,
      i = 0,
      entry, miss, count, unit, b;

  for (; i<n; ++i) {
    entry = entries[i];

    if (unitIdx && intersect) {
      // multi selections union within the same unit and intersect across units.
      miss = miss || {};
      count = miss[unit=entry.unit] || 0;

      // if we've already matched this unit, skip.
      if (count === -1) continue;

      b = testPoint(datum, entry);
      miss[unit] = b ? -1 : ++count;

      // if we match and there are no other units return true
      // if we've missed against all tuples in this unit return false
      if (b && unitIdx.size === 1) return true;
      if (!b && count === unitIdx.get(unit).count) return false;
    } else {
      b = testPoint(datum, entry);

      // if we find a miss and we do require intersection return false
      // if we find a match and we don't require intersection return true
      if (intersect ^ b) return b;
    }
  }

  // if intersecting and we made it here, then we saw no misses
  // if not intersecting, then we saw no matches
  // if no active selections, return false
  return n && intersect;
}

export function vlSelectionVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error('First argument to indata must be a string literal.');

  var data = args[0].value,
      op = args.length >= 2 && args[args.length-1].value,
      field = 'unit',
      indexName = indexPrefix + field;

  if (op === INTERSECT && !params.hasOwnProperty(indexName)) {
    params[indexName] = scope.getData(data).indataRef(scope, field);
  }

  dataVisitor(name, args, scope, params);
}

/**
 * Resolves selection for use as a scale domain or reads via the API.
 * @param {string} name - The name of the dataset representing the selection
 * @param {string} [op='union'] - The set operation for combining selections.
 *                 One of 'intersect' or 'union' (default).
 * @returns {object} An object of selected fields and values.
 */
export function vlSelectionResolve(name, op) {
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
  op = op || UNION;
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
  'E_union': function (base, value) {
    if (!base.length) return value;

    var i = 0, n = value.length;
    for (; i<n; ++i) if (base.indexOf(value[i]) < 0) base.push(value[i]);
    return base;
  },

  'E_intersect': function (base, value) {
    return !base.length ? value :
      base.filter(function (v) { return value.indexOf(v) >= 0; });
  },

  'R_union': function (base, value) {
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

  'R_intersect': function (base, value) {
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
}
