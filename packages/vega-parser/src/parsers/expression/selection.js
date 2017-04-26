import {field} from 'vega-util';
import inrange from './inrange';

var UNION = 'union',
    UNIT = 'unit',
    OTHERS = 'others';

function testPoint(datum, entry) {
  var fields = entry.fields,
      values = entry.values,
      getter = entry.getter || (entry.getter = []),
      n = fields.length,
      i = 0;

  for (; i<n; ++i) {
    getter[i] = getter[i] || field(fields[i]);
    if (getter[i](datum) !== values[i]) return false;
  }

  return true;
}

function testInterval(datum, entry) {
  var ivals = entry.intervals,
      n = ivals.length,
      i = 0,
      getter;

  for (; i<n; ++i) {
    getter = ivals[i].getter || (ivals[i].getter = field(ivals[i].field));
    if (ivals[i].extent[0] === ivals[i].extent[1]) return true;
    if (!inrange(getter(datum), ivals[i].extent)) return false;
  }
  return true;
}

/**
 * Tests if a tuple is contained within an interactive selection.
 * @param {string} name - The name of the data set representing the selection.
 * @param {*} unit - A unique key value indicating the current unit chart.
 * @param {object} datum - The tuple to test for inclusion.
 * @param {string} op - The set operation for combining selections.
 *   One of 'intersect' (default) or 'union'.
 * @param {string} scope - The scope within which to resolve the selection.
 *   One of 'all' (default, resolve against active selections across all unit charts),
 *   'unit' (consider only selections in the current unit chart),
 *   'others' (resolve against all units *except* the current unit).
 * @param {function(object,object):boolean} test - A boolean-valued test
 *   predicate for determining selection status within a single unit chart.
 * @return {boolean} - True if the datum is in the selection, false otherwise.
 */
function vlSelection(name, unit, datum, op, scope, test) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      intersect = op !== UNION,
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
  // if no active selections, return true
  return !n || intersect;
}

// Assumes point selection tuples are of the form:
// {unit: string, encodings: array<string>, fields: array<string>, values: array<*>, }
export function vlPoint(name, unit, datum, op, scope) {
  return vlSelection.call(this, name, unit, datum, op, scope, testPoint);
}

// Assumes interval selection typles are of the form:
// {unit: string, intervals: array<{encoding: string, field:string, extent:array<number>}>}
export function vlInterval(name, unit, datum, op, scope) {
  return vlSelection.call(this, name, unit, datum, op, scope, testInterval);
}

/**
 * Materializes a point selection as a scale domain. With point selections,
 * we assume that they are projected over a single field or encoding channel.
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
      units = {}, count = 0,
      values = {}, domain = [],
      i = 0, n = entries.length,
      entry, unit, v, key;

  for (; i<n; ++i) {
    entry = entries[i];
    unit  = entry.unit;
    key   = entry.values[0];

    if (!units[unit]) units[unit] = ++count;

    if ((encoding && entry.encodings[0] === encoding) ||
        (field && entry.fields[0] === field))
    {
      if (!(v = values[key])) {
        values[key] = v = {value: key, units: {}, count: 0};
      }
      if (!v.units[unit]) v.units[unit] = ++v.count;
    }
  }

  for (key in values) {
    if (op !== UNION && (v = values[key]).count !== count) continue;
    domain.push(v.value);
  }

  return domain.length ? domain : undefined;
}

/**
 * Materializes an interval selection as a scale domain.
 * @param {string} name - The name of the dataset representing the selection.
 * @param {string} [encoding] - A particular encoding channel to materialize.
 * @param {string} [field] - A particular field to materialize.
 * @param {string} [op='intersect'] - The set operation for combining selections.
 * One of 'intersect' (default) or 'union'.
 * @returns {array} An array of values to serve as a scale domain.
 */
export function vlIntervalDomain(name, encoding, field, op) {
  var merge = op === UNION ? unionInterval : intersectInterval,
      data = this.context.data[name],
      entries = data ? data.values.value : [],
      i = 0, n = entries.length,
      entry, m, j, interval, extent, domain, lo, hi;

  for (; i<n; ++i) {
    entry = entries[i].intervals;

    for (j=0, m=entry.length; j<m; ++j) {
      interval = entry[j];
      if ((encoding && interval.encoding === encoding) ||
          (field && interval.field === field))
      {
        extent = interval.extent, lo = extent[0], hi = extent[1];
        if (lo > hi) hi = extent[1], lo = extent[0];
        domain = domain ? merge(domain, lo, hi) : [lo, hi];
      }
    }
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
