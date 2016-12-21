import Transform from '../Transform';
import {inherits} from 'vega-util';

/**
 * Extend tuples by joining them with values from a lookup table.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Map} params.index - The lookup table map.
 * @param {Array<function(object): *} params.fields - The fields to lookup.
 * @param {Array<string>} params.as - Output field names for each lookup value.
 * @param {*} [params.default] - A default value to use if lookup fails.
 */
export default function Lookup(params) {
  Transform.call(this, {}, params);
}

var prototype = inherits(Lookup, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse,
      as = _.as,
      keys = _.fields,
      index = _.index,
      defaultValue = _.default==null ? null : _.default,
      reset = _.modified(),
      flag = pulse.ADD,
      set, key, field, mods;

  if (keys.length === 1) {
    key = keys[0];
    field = as[0];
    set = function(t) {
      var v = index.get(key(t));
      t[field] = v==null ? defaultValue : v;
    };
  } else {
    set = function(t) {
      for (var i=0, n=keys.length, v; i<n; ++i) {
        v = index.get(keys[i](t));
        t[as[i]] = v==null ? defaultValue : v;
      }
    };
  }

  if (reset) {
    flag = pulse.SOURCE;
    out = pulse.reflow(true);
  } else {
    mods = keys.some(function(k) { return pulse.modified(k.fields); });
    flag |= (mods ? pulse.MOD : 0);
  }
  pulse.visit(flag, set);

  return out.modifies(as);
};
