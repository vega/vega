import {ingest} from './Tuple';
import {array, constant, isFunction} from 'vega-util';

export function isChangeSet(v) {
  return v && v.constructor === changeset;
}

export default function changeset() {
  var add = [],  // insert tuples
      rem = [],  // remove tuples
      mod = [],  // modify tuples
      remp = [], // remove by predicate
      modp = []; // modify by predicate

  return {
    constructor: changeset,
    insert: function(t) {
      var d = array(t), i = 0, n = d.length;
      for (; i<n; ++i) add.push(d[i]);
      return this;
    },
    remove: function(t) {
      var a = isFunction(t) ? remp : rem,
          d = array(t), i = 0, n = d.length;
      for (; i<n; ++i) a.push(d[i]);
      return this;
    },
    modify: function(t, field, value) {
      var m = {field: field, value: constant(value)};
      if (isFunction(t)) m.filter = t, modp.push(m);
      else m.tuple = t, mod.push(m);
      return this;
    },
    encode: function(t, set) {
      mod.push({tuple: t, field: set});
      return this;
    },
    pulse: function(pulse, tuples) {
      var out, i, n, m, f, t, id;

      // add
      for (i=0, n=add.length; i<n; ++i) {
        pulse.add.push(ingest(add[i]));
      }

      // remove
      for (out={}, i=0, n=rem.length; i<n; ++i) {
        t = rem[i];
        out[t._id] = t;
      }
      for (i=0, n=remp.length; i<n; ++i) {
        f = remp[i];
        tuples.forEach(function(t) {
          if (f(t)) out[t._id] = t;
        });
      }
      for (id in out) pulse.rem.push(out[id]);

      // modify
      function modify(t, f, v) {
        if (v) t[f] = v(t); else pulse.encode = f;
        out[t._id] = t;
      }
      for (out={}, i=0, n=mod.length; i<n; ++i) {
        m = mod[i];
        modify(m.tuple, m.field, m.value);
        pulse.modifies(m.field);
      }
      for (i=0, n=modp.length; i<n; ++i) {
        m = modp[i];
        f = m.filter;
        tuples.forEach(function(t) {
          if (f(t)) modify(t, m.field, m.value);
        });
        pulse.modifies(m.field);
      }
      for (id in out) pulse.mod.push(out[id]);

      return pulse;
    }
  };
}
