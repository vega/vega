var d3 = require('d3');

function x(o)     { return o.x || 0; }
function y(o)     { return o.y || 0; }
function xw(o)    { return o.x + o.width || 0; }
function yh(o)    { return o.y + o.height || 0; }
function size(o)  { return o.size==null ? 100 : o.size; }
function shape(o) { return o.shape || 'circle'; }

module.exports = {
  metadata: {
    'version': '1.1',
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink'
  },
  path: {
    arc:    d3.svg.arc(),
    areav:  d3.svg.area().x(x).y1(y).y0(yh),
    areah:  d3.svg.area().y(y).x0(xw).x1(x),
    line:   d3.svg.line().x(x).y(y),
    symbol: d3.svg.symbol().type(shape).size(size)
  },
  textAlign: {
    'left':   'start',
    'center': 'middle',
    'right':  'end'
  },
  styles: {
    'fill':             'fill',
    'fillOpacity':      'fill-opacity',
    'stroke':           'stroke',
    'strokeWidth':      'stroke-width',
    'strokeOpacity':    'stroke-opacity',
    'strokeCap':        'stroke-linecap',
    'strokeDash':       'stroke-dasharray',
    'strokeDashOffset': 'stroke-dashoffset',
    'opacity':          'opacity'
  },
  styleProperties: [
    'fill',
    'fillOpacity',
    'stroke',
    'strokeWidth',
    'strokeOpacity',
    'strokeCap',
    'strokeDash',
    'strokeDashOffset',
    'opacity'
  ]
};
