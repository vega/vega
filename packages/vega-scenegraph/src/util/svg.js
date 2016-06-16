var dl = require('datalib'),
    d3_svg = require('d3').svg,
    parse = require('../path/parse');

function x(o)     { return o.x || 0; }
function y(o)     { return o.y || 0; }
function xw(o)    { return (o.x || 0) + (o.width || 0); }
function yh(o)    { return (o.y || 0) + (o.height || 0); }
function size(o)  { return o.size == null ? 100 : o.size; }
function shape(o) { return o.shape || 'circle'; }

var areav = d3_svg.area().x(x).y1(y).y0(yh),
    areah = d3_svg.area().y(y).x1(x).x0(xw),
    line  = d3_svg.line().x(x).y(y);

module.exports = {
  metadata: {
    'version': '1.1',
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink'
  },
  path: {
    arc: d3_svg.arc(),
    symbol: d3_svg.symbol().type(shape).size(size),
    area: function(items) {
      var o = items[0];
      return (o.orient === 'horizontal' ? areah : areav)
        .interpolate(o.interpolate || 'linear')
        .tension(o.tension || 0.7)
        (items);
    },
    line: function(items) {
      var o = items[0];
      return line
        .interpolate(o.interpolate || 'linear')
        .tension(o.tension || 0.7)
        (items);
    },
    resize: function(pathStr, size) {
      var path = parse(pathStr),
          newPath = '',
          command, current, index, i, n, j, m;

      size = Math.sqrt(size);
      for (i=0, n=path.length; i<n; ++i) {
        for (command=path[i], j=0, m=command.length; j<m; ++j) {
          if (command[j] === 'Z') break;
          if ((current = +command[j]) === current) {
            // if number, need to resize
            index = pathStr.indexOf(current);
            newPath += pathStr.substring(0, index) + (current * size);
            pathStr  = pathStr.substring(index + (current+'').length);
          }
        }
      }

      return newPath + 'Z';
    }
  },
  symbolTypes: dl.toMap(d3_svg.symbolTypes),
  textAlign: {
    'left':   'start',
    'center': 'middle',
    'right':  'end'
  },
  textBaseline: {
    'top':    'before-edge',
    'bottom': 'after-edge',
    'middle': 'central'
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
