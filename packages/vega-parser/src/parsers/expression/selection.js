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
// {unit: string, fields: array<string>, values: array<*>, }
export function vlPoint(name, unit, datum, op, scope) {
  return vlSelection.call(this, name, unit, datum, op, scope, testPoint);
}

// Assumes interval selection typles are of the form:
// {unit: string, intervals: array<{field:string, extent:array<number>}>}
export function vlInterval(name, unit, datum, op, scope) {
  return vlSelection.call(this, name, unit, datum, op, scope, testInterval);
}
