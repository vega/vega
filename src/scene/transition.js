vg.scene.Transition = (function() {
  function trans(duration, ease) {
    this.duration = duration || 500;
    this.ease = ease && d3.ease(ease) || d3.ease("cubic-in-out");
    this.updates = {next: null};
  }
  
  var prototype = trans.prototype;
  
  prototype.interpolate = function(item, values) {
    var key, curr, next, interp, list = null;

    for (key in values) {
      curr = item[key];
      next = values[key];
      if (curr !== next) {
        interp = d3.interpolate(curr, next);
        interp.property = key;
        (list || (list=[])).push(interp);
      }
    }

    if (interp) {
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
      if (curr.item.status === vg.scene.EXIT) curr.remove = true;
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

      if (f === 1) {
        if (curr.remove) item.remove();
        prev.next = curr.next;
        curr = prev;
      } else {
        stop = false;
      }
    }

    this.callback();
    return stop;
  };
  
  return trans;
  
})();

vg.scene.transition = function(dur, ease) {
  return new vg.scene.Transition(dur, ease);
};