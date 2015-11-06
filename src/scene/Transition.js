var d3 = require('d3'),
    bound = require('vega-scenegraph').bound,
    Tuple = require('vega-dataflow').Tuple,
    Status = require('./Builder').STATUS;

function Transition(duration, ease) {
  this.duration = duration || 500;
  this.ease = ease && d3.ease(ease) || d3.ease('cubic-in-out');
  this.updates = {next: null};
}

var prototype = Transition.prototype;

var skip = {
  'text': 1,
  'url':  1
};

prototype.interpolate = function(item, values) {
  var key, curr, next, interp, list = null;

  for (key in values) {
    curr = item[key];
    next = values[key];
    if (curr !== next) {
      if (skip[key] || curr === undefined) {
        // skip interpolation for specific keys or undefined start values
        Tuple.set(item, key, next);
      } else if (typeof curr === 'number' && !isFinite(curr)) {
        // for NaN or infinite numeric values, skip to final value
        Tuple.set(item, key, next);
      } else {
        // otherwise lookup interpolator
        interp = d3.interpolate(curr, next);
        interp.property = key;
        (list || (list=[])).push(interp);
      }
    }
  }

  if (list === null && item.status === Status.EXIT) {
    list = []; // ensure exiting items are included
  }

  if (list != null) {
    list.item = item;
    list.ease = item.mark.ease || this.ease;
    list.next = this.updates.next;
    this.updates.next = list;
  }
  return this;
};

prototype.start = function(callback) {
  var t = this, prev = t.updates, curr = prev.next;
  for (; curr!=null; prev=curr, curr=prev.next) {
    if (curr.item.status === Status.EXIT) {
      // Only mark item as exited when it is removed.
      curr.item.status = Status.UPDATE;
      curr.remove = true;
    }
  }
  t.callback = callback;
  d3.timer(function(elapsed) { return step.call(t, elapsed); });
};

function step(elapsed) {
  var list = this.updates, prev = list, curr = prev.next,
      duration = this.duration,
      item, delay, f, e, i, n, stop = true;

  for (; curr!=null; prev=curr, curr=prev.next) {
    item = curr.item;
    delay = item.delay || 0;

    f = (elapsed - delay) / duration;
    if (f < 0) { stop = false; continue; }
    if (f > 1) f = 1;
    e = curr.ease(f);

    for (i=0, n=curr.length; i<n; ++i) {
      item[curr[i].property] = curr[i](e);
    }
    item.touch();
    bound.item(item);

    if (f === 1) {
      if (curr.remove) {
        item.status = Status.EXIT;
        item.remove();
      }
      prev.next = curr.next;
      curr = prev;
    } else {
      stop = false;
    }
  }

  this.callback();
  return stop;
}

module.exports = Transition;
