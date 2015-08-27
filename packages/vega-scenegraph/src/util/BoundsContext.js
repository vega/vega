module.exports = function(b) {
  function noop() { }
  function add(x,y) { b.add(x, y); }

  return {
    bounds: function(_) {
      if (!arguments.length) return b;
      return (b = _, this);
    },
    beginPath: noop,
    closePath: noop,
    moveTo: add,
    lineTo: add,
    quadraticCurveTo: function(x1, y1, x2, y2) {
      b.add(x1, y1);
      b.add(x2, y2);
    },
    bezierCurveTo: function(x1, y1, x2, y2, x3, y3) {
      b.add(x1, y1);
      b.add(x2, y2);
      b.add(x3, y3);
    }
  };
};
