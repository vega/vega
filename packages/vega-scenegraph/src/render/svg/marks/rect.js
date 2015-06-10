module.exports = {
  tag:    'rect',
  update: function(el, o) {
    el.setAttribute('x', o.x || 0);
    el.setAttribute('y', o.y || 0);
    el.setAttribute('width', o.width || 0);
    el.setAttribute('height', o.height || 0);
  }
};
