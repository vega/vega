import {error, zero} from 'vega-util';

export function WindowOp(op, field, param, as) {
  var fn = WindowOps[op](field, param);
  return {
    init:   fn.init || zero,
    update: function(w, t) { t[as] = fn.next(w); }
  };
}

export var WindowOps = {
  row_number: function() {
    return {
      next: function(w) { return w.index + 1; }
    };
  },
  rank: function() {
    var rank;
    return {
      init: function() { rank = 1; },
      next: function(w) {
        var i = w.index,
            data = w.data;
        return (i && w.compare(data[i - 1], data[i])) ? (rank = i + 1) : rank;
      }
    };
  },
  dense_rank: function() {
    var drank;
    return {
      init: function() { drank = 1; },
      next: function(w) {
        var i = w.index,
            d = w.data;
        return (i && w.compare(d[i - 1], d[i])) ? ++drank : drank;
      }
    };
  },
  percent_rank: function() {
    var rank = WindowOps.rank(),
        next = rank.next;
    return {
      init: rank.init,
      next: function(w) {
        return (next(w) - 1) / (w.data.length - 1);
      }
    };
  },
  cume_dist: function() {
    var cume;
    return {
      init: function() { cume = 0; },
      next: function(w) {
        var i = w.index,
            d = w.data,
            c = w.compare;
        if (cume < i) {
          while (i + 1 < d.length && !c(d[i], d[i + 1])) ++i;
          cume = i;
        }
        return (1 + cume) / d.length;
      }
    };
  },
  ntile: function(field, num) {
    num = +num;
    if (!(num > 0)) error('ntile num must be greater than zero.');
    var cume = WindowOps.cume_dist(),
        next = cume.next;
    return {
      init: cume.init,
      next: function(w) { return Math.ceil(num * next(w)); }
    };
  },

  lag: function(field, offset) {
    offset = +offset || 1;
    return {
      next: function(w) {
        var i = w.index - offset;
        return i >= 0 ? field(w.data[i]) : null;
      }
    };
  },
  lead: function(field, offset) {
    offset = +offset || 1;
    return {
      next: function(w) {
        var i = w.index + offset,
            d = w.data;
        return i < d.length ? field(d[i]) : null;
      }
    };
  },

  first_value: function(field) {
    return {
      next: function(w) { return field(w.data[w.i0]); }
    };
  },
  last_value: function(field) {
    return {
      next: function(w) { return field(w.data[w.i1 - 1]); }
    }
  },
  nth_value: function(field, nth) {
    nth = +nth;
    if (!(nth > 0)) error('nth_value nth must be greater than zero.');
    return {
      next: function(w) {
        var i = w.i0 + (nth - 1);
        return i < w.i1 ? field(w.data[i]) : null;
      }
    }
  }
};

export var ValidWindowOps = Object.keys(WindowOps);
