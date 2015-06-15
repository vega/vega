var gradient_id = 0;

function Gradient(type) {
  this.id = 'gradient_' + (gradient_id++);
  this.type = type || 'linear';
  this.stops = [];
  this.x1 = 0;
  this.x2 = 1;
  this.y1 = 0;
  this.y2 = 0;
}

var prototype = Gradient.prototype;

prototype.stop = function(offset, color) {
  this.stops.push({
    offset: offset,
    color: color
  });
  return this;
};

module.exports = Gradient;