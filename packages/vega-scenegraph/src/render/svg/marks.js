var font = require('../../util/font'),
    SVG = require('../../util/svg'),
    textAlign = SVG.textAlign,
    path = SVG.path;

module.exports = {
  arc: {
    tag:  'path',
    type: 'arc',
    attr: function(emit, o) {
      emit('transform', 'translate(' + (o.x || 0) +',' + (o.y || 0) + ')');
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
      emit('transform', 'translate('+ (o.x||0) + ',' + (o.y||0) + ')');
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
      emit('x', x);
      emit('y', y);
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
      emit('transform', 'translate(' + (o.x || 0) +',' + (o.y || 0) + ')');
      emit('d', o.path);
    }
  },
  rect: {
    tag:  'rect',
    type: 'rect',
    nest: false,
    attr: function(emit, o) {
      emit('x', o.x || 0);
      emit('y', o.y || 0);
      emit('width', o.width || 0);
      emit('height', o.height || 0);
    }
  },
  rule: {
    tag:  'line',
    type: 'rule',
    attr: function(emit, o) {
      var x1, y1;
      emit('x1', x1 = o.x || 0);
      emit('y1', y1 = o.y || 0);
      emit('x2', o.x2 != null ? o.x2 : x1);
      emit('y2', o.y2 != null ? o.y2 : y1);
    }
  },
  symbol: {
    tag:  'path',
    type: 'symbol',
    attr: function(emit, o) {
      emit('transform', 'translate(' + (o.x || 0) +',' + (o.y || 0) + ')');
      emit('d', path.symbol(o));
    }
  },
  text: {
    tag:  'text',
    type: 'text',
    nest: false,
    attr: function(emit, o) {
      var x = o.x || 0,
          y = o.y || 0,
          a = o.angle || 0,
          r = o.radius || 0, t;

      if (r) {
        t = (o.theta || 0) - Math.PI/2;
        x += r * Math.cos(t);
        y += r * Math.sin(t);
      }

      emit('x', x + (o.dx || 0));
      emit('y', y + (o.dy || 0) + font.offset(o));
      emit('text-anchor', textAlign[o.align] || 'start');
      emit('transform', a ? 'rotate('+a+' '+x+','+y+')' : null);
    }
  }
};
