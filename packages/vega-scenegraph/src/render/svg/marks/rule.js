module.exports = {
  tag:    'line',
  update: function(el, o) {
    var x1 = o.x || 0,
        y1 = o.y || 0;
    el.setAttribute('x1', x1);
    el.setAttribute('y1', y1);
    el.setAttribute('x2', o.x2 != null ? o.x2 : x1);
    el.setAttribute('y2', o.y2 != null ? o.y2 : y1);
  }
};
