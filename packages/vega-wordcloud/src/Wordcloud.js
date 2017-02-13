import cloud from './CloudLayout';
import {transforms, Transform} from 'vega-dataflow';
import {constant, inherits, isFunction, truthy} from 'vega-util';
import {scale} from 'vega-scale';

var output = ['x', 'y', 'font', 'fontSize', 'fontStyle', 'fontWeight', 'angle'];
var params = ['text', 'font', 'rotate', 'fontSize', 'fontStyle', 'fontWeight'];

export default function Wordcloud(params) {
  Transform.call(this, cloud(), params);
}

var prototype = inherits(Wordcloud, Transform);

prototype.transform = function(_, pulse) {
  function modp(param) {
    var p = _[param];
    return isFunction(p) && pulse.modified(p.fields);
  }

  var mod = _.modified();
  if (!(mod || pulse.changed(pulse.ADD_REM) || params.some(modp))) return;

  var layout = this.value,
      as = _.as || output,
      fontSize = _.fontSize || 14,
      range;

  isFunction(fontSize)
    ? (range = _.fontSizeRange)
    : (fontSize = constant(fontSize));

  // create font size scaling function as needed
  if (range) {
    var fsize = fontSize,
        sizeScale = scale('sqrt')()
          .domain(extent(fsize, pulse))
          .range(range);
    fontSize = function(x) { return sizeScale(fsize(x)); };
  }

  var data = pulse.materialize(pulse.SOURCE).source;
  data.forEach(function(t) {
    t[as[0]] = NaN;
    t[as[1]] = NaN;
    t[as[3]] = 0;
  });

  // configure layout
  var words = layout
    .words(data)
    .text(_.text)
    .size(_.size || [500, 500])
    .padding(_.padding || 1)
    .spiral(_.spiral || 'archimedean')
    .rotate(_.rotate || 0)
    .font(_.font || 'sans-serif')
    .fontStyle(_.fontStyle || 'normal')
    .fontWeight(_.fontWeight || 'normal')
    .fontSize(fontSize)
    .layout();

  var size = layout.size(),
      dx = size[0] >> 1,
      dy = size[1] >> 1,
      i = 0,
      n = words.length,
      w, t;

  for (; i<n; ++i) {
    w = words[i];
    t = w.datum;
    t[as[0]] = w.x + dx;
    t[as[1]] = w.y + dy;
    t[as[2]] = w.font;
    t[as[3]] = w.size;
    t[as[4]] = w.style;
    t[as[5]] = w.weight;
    t[as[6]] = w.rotate;
  }

  return pulse.reflow(mod).modifies(as);
};

function extent(size, pulse) {
  var e = new transforms.Extent();
  e.transform({field: size, modified: truthy}, pulse);
  return e.value;
}
