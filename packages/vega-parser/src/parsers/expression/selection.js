import {field, isNumber, isString, isDate, toNumber} from 'vega-util';
import inrange from './inrange';

var BIN = 'bin_',
    INTERSECT = 'intersect',
    UNIT = 'unit',
    OTHERS = 'others';

function testPoint(datum, entry) {
  var fields = entry.fields,
      values = entry.values,
      getter = entry.getter || (entry.getter = []),
      n = fields.length,
      i = 0, dval;

  for (; i<n; ++i) {
    getter[i] = getter[i] || field(fields[i]);
    dval = getter[i](datum);
    if (isDate(dval)) dval = toNumber(dval);
    if (isDate(values[i])) values[i] = toNumber(values[i]);
    if (entry[BIN + fields[i]]) {
      if (isDate(values[i][0])) values[i] = values[i].map(toNumber);
      if (!inrange(dval, values[i], true, false)) return false;
    } else if (dval !== values[i]) {
      return false;
    }
  }

  return true;
}

// TODO: revisit date coercion?
// have selections populate with consistent types upon write?

function testInterval(datum, entry) {
  var ivals = entry.intervals,
      n = ivals.length,
      i = 0,
      getter, extent, value;

  for (; i<n; ++i) {
    extent = ivals[i].extent;
    getter = ivals[i].getter || (ivals[i].getter = field(ivals[i].field));
    value = getter(datum);
    if (!extent || extent[0] === extent[1]) return false;
    if (isDate(value)) value = toNumber(value);
    if (isDate(extent[0])) extent = ivals[i].extent = extent.map(toNumber);
    if (isNumber(extent[0]) && !inrange(value, extent)) return false;
    else if (isString(extent[0]) && extent.indexOf(value) < 0) return false;
  }

  return true;
}

/**
 * Tests if a tuple is contained within an interactive selection.
 * @param {string} name - The name of the data set representing the selection.
 * @param {object} datum - The tuple to test for inclusion.
 * @param {string} op - The set operation for combining selections.
 *   One of 'intersect' or 'union' (default).
 * @param {*} unit - A unique key value indicating the current unit chart.
 * @param {string} scope - The scope within which to resolve the selection.
 *   One of 'all' (default, resolve against active selections across all unit charts),
 *   'unit' (consider only selections in the current unit chart),
 *   'others' (resolve against all units *except* the current unit).
 * @param {function(object,object):boolean} test - A boolean-valued test
 *   predicate for determining selection status within a single unit chart.
 * @return {boolean} - True if the datum is in the selection, false otherwise.
 */
function vlSelection(name, datum, op, unit, scope, test) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      intersect = op === INTERSECT,
      n = entries.length,
      i = 0,
      entry, b;

  for (; i<n; ++i) {
    entry = entries[i];

    // is the selection entry from the current unit?
    b = unit === entry.unit;

    // perform test if source unit is a valid selection source
    if (!(scope === OTHERS && b || scope === UNIT && !b)) {
      b = test(datum, entry);

      // if we find a match and we don't require intersection return true
      // if we find a miss and we do require intersection return false
      if (intersect ^ b) return b;
    }
  }

  // if intersecting and we made it here, then we saw no misses
  // if not intersecting, then we saw no matches
  // if no active selections, return false
  return n && intersect;
}

// Assumes point selection tuples are of the form:
// {unit: string, encodings: array<string>, fields: array<string>, values: array<*>, bins: object}
export function vlPoint(name, datum, op, unit, scope) {
  return vlSelection.call(this, name, datum, op, unit, scope, testPoint);
}

// Assumes interval selection typles are of the form:
// {unit: string, intervals: array<{encoding: string, field:string, extent:array<number>}>}
export function vlInterval(name, datum, op, unit, scope) {
  return vlSelection.call(this, name, datum, op, unit, scope, testInterval);
}

/**
 * Materializes a point selection as a scale domain.
 * @param {string} name - The name of the dataset representing the selection.
 * @param {string} [encoding] - A particular encoding channel to materialize.
 * @param {string} [field] - A particular field to materialize.
 * @param {string} [op='intersect'] - The set operation for combining selections.
 * One of 'intersect' (default) or 'union'.
 * @returns {array} An array of values to serve as a scale domain.
 */
export function vlPointDomain(name, encoding, field, op) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      entry = entries[0],
      i = 0, n, index, values, continuous;

  if (!entry) return undefined;

  for (n = encoding ? entry.encodings.length : entry.fields.length; i<n; ++i) {
    if ((encoding && entry.encodings[i] === encoding) ||
        (field && entry.fields[i] === field)) {
      index = i;
      continuous = entry[BIN + entry.fields[i]];
      break;
    }
  }

  values = entries.reduce(function(acc, entry) {
    acc.push({
      unit: entry.unit,
      value: entry.values[index]
    });
    return acc;
  }, []);

  return continuous ? continuousDomain(values, op) : discreteDomain(values, op);
}

/**
 * Materializes an interval selection as a scale domain.
 * @param {string} name - The name of the dataset representing the selection.
 * @param {string} [encoding] - A particular encoding channel to materialize.
 * @param {string} [field] - A particular field to materialize.
 * @param {string} [op='union'] - The set operation for combining selections.
 * One of 'intersect' or 'union' (default).
 * @returns {array} An array of values to serve as a scale domain.
 */
export function vlIntervalDomain(name, encoding, field, op) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      entry = entries[0],
      i = 0, n, interval, index, values, discrete;

  if (!entry) return undefined;

  for (n = entry.intervals.length; i<n; ++i) {
    interval = entry.intervals[i];
    if ((encoding && interval.encoding === encoding) ||
        (field && interval.field === field)) {
      if (!interval.extent) return undefined;
      index = i;
      discrete = interval.extent.length > 2;
      break;
    }
  }

  values = entries.reduce(function(acc, entry) {
  var extent = entry.intervals[index].extent,
      value = discrete
         ? extent.map(function (d) { return {unit: entry.unit, value: d}; })
         : {unit: entry.unit, value: extent};

     if (discrete) {
       acc.push.apply(acc, value);
       return acc;
     } else {
       acc.push(value);
       return acc;
     }
  }, []);


  return discrete ? discreteDomain(values, op) : continuousDomain(values, op);
}

function discreteDomain(entries, op) {
  var units = {}, count = 0,
      values = {}, domain = [],
      i = 0, n = entries.length,
      entry, unit, v, key;

  for (; i<n; ++i) {
    entry = entries[i];
    unit  = entry.unit;
    key   = entry.value;

    if (!units[unit]) units[unit] = ++count;
    if (!(v = values[key])) {
      values[key] = v = {value: key, units: {}, count: 0};
    }
    if (!v.units[unit]) v.units[unit] = ++v.count;
  }

  for (key in values) {
    v = values[key];
    if (op === INTERSECT && v.count !== count) continue;
    domain.push(v.value);
  }

  return domain.length ? domain : undefined;
}

function continuousDomain(entries, op) {
  var merge = op === INTERSECT ? intersectInterval : unionInterval,
      i = 0, n = entries.length,
      extent, domain, lo, hi;

  for (; i<n; ++i) {
    extent = entries[i].value;
    if (isDate(extent[0])) extent = extent.map(toNumber);
    lo = extent[0];
    hi = extent[1];
    if (lo > hi) {
      hi = extent[0];
      lo = extent[1];
    }
    domain = domain ? merge(domain, lo, hi) : [lo, hi];
  }

  return domain && domain.length && (+domain[0] !== +domain[1])
    ? domain
    : undefined;
}

function unionInterval(domain, lo, hi) {
  if (domain[0] > lo) domain[0] = lo;
  if (domain[1] < hi) domain[1] = hi;
  return domain;
}

function intersectInterval(domain, lo, hi) {
  if (hi < domain[0] || domain[1] < lo) {
    return [];
  } else {
    if (domain[0] < lo) domain[0] = lo;
    if (domain[1] > hi) domain[1] = hi;
  }
  return domain;
}
