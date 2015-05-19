
var vec2d = function(x, y) {
  return {x: x, y: y};
};

var dot = function(a, b) {
  return a.x * b.x + a.y * b.y;
};

var times = function(s, v) {
  return vec2d(s * v.x, s * v.y);
};

var normalized = function(v) {
  var len = veclen(v);
  return vec2d(v.x / len, v.y / len);
};

var veclen = function(v) {
  return Math.sqrt(v.x*v.x + v.y*v.y);
};

module.exports = {
  vec2d: vec2d,
  dot: dot,
  times: times,
  normalized: normalized,
  veclen: veclen
};
