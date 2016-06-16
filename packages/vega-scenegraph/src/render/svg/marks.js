var text = require('../../util/text'),
    SVG = require('../../util/svg'),
    symbolTypes = SVG.symbolTypes,
    textAlign = SVG.textAlign,
    path = SVG.path;

function translateItem(o) {
  return translate(o.x || 0, o.y || 0);
}

function translate(x, y) {
  return 'translate(' + x + ',' + y + ')';
}

module.exports = {
  arc: {
    tag:  'path',
    type: 'arc',
    attr: function(emit, o) {
      emit('transform', translateItem(o));
      emit('d', path.arc(o));
    }
  },
  area: {
    tag:  'path',
    type: 'area',
    nest: true,
    attr: function(emit, o) {
      var items = o.mark.items;
      if (items.length) emit('d', path.area(items));
    }
  },
  group: {
    tag:  'g',
    type: 'group',
    attr: function(emit, o, renderer) {
      var id = null, defs, c;
      emit('transform', translateItem(o));
      if (o.clip) {
        defs = renderer._defs;
        id = o.clip_id || (o.clip_id = 'clip' + defs.clip_id++);
        c = defs.clipping[id] || (defs.clipping[id] = {id: id});
        c.width = o.width || 0;
        c.height = o.height || 0;
      }
      emit('clip-path', id ? ('url(#' + id + ')') : null);
    },
    background: function(emit, o) {
      emit('class', 'background');
      emit('width', o.width || 0);
      emit('height', o.height || 0);
    }
  },
  image: {
    tag:  'image',
    type: 'image',
    attr: function(emit, o, renderer) {
      var x = o.x || 0,
          y = o.y || 0,
          w = o.width || 0,
          h = o.height || 0,
          url = renderer.imageURL(o.url);

      x = x - (o.align === 'center' ? w/2 : o.align === 'right' ? w : 0);
      y = y - (o.baseline === 'middle' ? h/2 : o.baseline === 'bottom' ? h : 0);

      emit('href', url, 'http://www.w3.org/1999/xlink', 'xlink:href');
      emit('transform', translate(x, y));
      emit('width', w);
      emit('height', h);
    }
  },
  line: {
    tag:  'path',
    type: 'line',
    nest: true,
    attr: function(emit, o) {
      var items = o.mark.items;
      if (items.length) emit('d', path.line(items));
    }
  },
  path: {
    tag:  'path',
    type: 'path',
    attr: function(emit, o) {
      emit('transform', translateItem(o));
      emit('d', o.path);
    }
  },
  rect: {
    tag:  'rect',
    type: 'rect',
    nest: false,
    attr: function(emit, o) {
      emit('transform', translateItem(o));
      emit('width', o.width || 0);
      emit('height', o.height || 0);
    }
  },
  rule: {
    tag:  'line',
    type: 'rule',
    attr: function(emit, o) {
      emit('transform', translateItem(o));
      emit('x2', o.x2 != null ? o.x2 - (o.x||0) : 0);
      emit('y2', o.y2 != null ? o.y2 - (o.y||0) : 0);
    }
  },
  symbol: {
    tag:  'path',
    type: 'symbol',
    attr: function(emit, o) {
      var pathStr = !o.shape || symbolTypes[o.shape] ?
        path.symbol(o) : path.resize(o.shape, o.size);

      emit('transform', translateItem(o));
      emit('d', pathStr);
    }
  },
  text: {
    tag:  'text',
    type: 'text',
    nest: false,
    attr: function(emit, o) {
      var dx = (o.dx || 0),
          dy = (o.dy || 0) + text.offset(o),
          x = (o.x || 0),
          y = (o.y || 0),
          a = o.angle || 0,
          r = o.radius || 0, t;

      if (r) {
        t = (o.theta || 0) - Math.PI/2;
        x += r * Math.cos(t);
        y += r * Math.sin(t);
      }

      emit('text-anchor', textAlign[o.align] || 'start');

      if (a) {
        t = translate(x, y) + ' rotate('+a+')';
        if (dx || dy) t += ' ' + translate(dx, dy);
      } else {
        t = translate(x+dx, y+dy);
      }
      emit('transform', t);
    }
  }
};
