vg.scene.Transition = (function() {
  function trans(duration, ease) {
    this.duration = duration || 500;
    this.ease = ease || d3.ease("cubic-in-out");
    this.updates = [];
    this.exits = [];
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
      list.ease = this.ease; // TODO parametrize
      this.updates.push(list);
    }
    return this;
  };
  
  prototype.remove = function(item) {
    this.exits.push(item);
    return this;
  };

  prototype.start = function(callback) {
    var t = this, duration = t.duration;
    d3.timer(function(elapsed) {
      if (elapsed >= duration) {
        return (t.stop(), callback(), true);
      } else {
        (t.step(elapsed, duration), callback());
      }
    });
  };

  prototype.step = function(elapsed, duration) {
    var updates = this.updates,
        frac = elapsed / duration,
        list, item, f, i, j, n, m;

    for (i=0, n=updates.length; i<n; ++i) {
      list = updates[i];
      item = list.item;
      f = list.ease(frac);
      for (j=0, m=list.length; j<m; ++j) {
        item[list[j].property] = list[j](f);
      }
    }
    return this;
  };
  
  prototype.stop = function() {
    this.step(1, 1);
    for (var e=this.exits, i=e.length; --i>=0;) e[i].remove();
    return this;
  };
  
  return trans;
  
})();

vg.scene.transition = function(dur, ease) {
  return new vg.scene.Transition(dur, ease);
};