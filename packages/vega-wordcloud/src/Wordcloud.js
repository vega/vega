import {transforms, Transform} from 'vega-dataflow';
import {constant, error, inherits, isFunction, truthy} from 'vega-util';
import {scale} from 'vega-scale';
import cloud from 'd3-cloud';

var output = ['x', 'y', 'font', 'fontSize', 'fontStyle', 'fontWeight', 'rotate'];

export default function Wordcloud(params) {
  Transform.call(this, cloud().canvas(canvas), params);
}

var prototype = inherits(Wordcloud, Transform);

prototype.transform = function(_, pulse) {
  var layout = this.value,
      as = _.as || output,
      fontSize = _.fontSize || 14,
      range, size, sizeScale;

  isFunction(fontSize)
    ? (range = _.fontSizeRange)
    : (fontSize = constant(fontSize));

  // create font size scaling function as needed
  if (range) {
    size = fontSize;
    sizeScale = scale('sqrt')().domain(extent(size, pulse)).range(range);
    fontSize = function(x) { return sizeScale(size(x)); };
  }

  var words = [];
  pulse.visit(pulse.SOURCE, function(t) { words.push(wrap(t)); });

  // configure layout
  layout
    .text(_.text)
    .size(_.size || [500, 500])
    .padding(_.padding || 1)
    .spiral(_.spiral || 'archimedean')
    .rotate(_.rotate || 0)
    .font(_.font || 'sans-serif')
    .fontStyle(_.fontStyle || 'normal')
    .fontWeight(_.fontWeight || 'normal')
    .fontSize(fontSize)
    .words(words) // wrap to avoid tuple writes
    .on('end', function(words) {
      var size = layout.size(),
          dx = size[0] >> 1,
          dy = size[1] >> 1,
          i = 0,
          n = words.length,
          w, t;

      for (; i<n; ++i) {
        w = words[i];
        t = w._tuple;
        t[as[0]] = w.x + dx;
        t[as[1]] = w.y + dy;
        t[as[2]] = w.font;
        t[as[3]] = w.size;
        t[as[4]] = w.style;
        t[as[5]] = w.weight;
        t[as[6]] = w.rotate;
      }
    })
    .start();

  return pulse.reflow().modifies(as);
};

function extent(size, pulse) {
  var e = new transforms.Extent();
  e.transform({field: size, modified: truthy}, pulse);
  return e.value;
}

function wrap(tuple) {
  var x = Object.create(tuple);
  return x._tuple = tuple, x;
}

function canvas() {
  try {
    return typeof document !== 'undefined' && document.createElement
      ? document.createElement('canvas')
      : new (require('canvas'))();
  } catch (e) {
    error('Canvas unavailable. Run in browser or install node-canvas.');
  }
}
