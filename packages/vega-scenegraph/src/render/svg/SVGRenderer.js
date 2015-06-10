var DOM = require('../../util/dom'),
    SVG = require('../../util/svg'),    
    ImageLoader = require('../../util/ImageLoader'),
    d3 = require('d3'),
    dl = require('datalib'),
    marks = require('./marks'),
    Renderer = require('../Renderer');

var href = (typeof window !== 'undefined' ? window.location.href : '');

function SVGRenderer(loadConfig) {
  Renderer.call(this);
  this._loader = new ImageLoader(loadConfig);
}

var base = Renderer.prototype;
var prototype = (SVGRenderer.prototype = Object.create(base));

prototype.initialize = function(el, width, height, padding) {
  if (el) {
    this._svg = DOM.appendUnique(el, 'svg', 'marks');
    // set the svg root group
    this._root = this._svg.append('g');
  }

  // create the svg definitions cache
  this._defs = {
    group_id: 0,
    clip_id:  0,
    gradient: {},
    clipping: {}
  };

  // set background color if defined
  this.background(this._bgcolor);

  return base.initialize.call(this, el, width, height, padding);
};

prototype.background = function(bgcolor) {
  if (arguments.length && this._svg) {
    this._svg.style('background-color', bgcolor);
  }
  return base.background.apply(this, arguments);
};

prototype.resize = function(width, height, padding) {
  base.resize.call(this, width, height, padding);
  
  if (this._svg) {
    var w = this._width,
        h = this._height,
        p = this._padding;
  
    this._svg
      .attr('width', w + p.left + p.right)
      .attr('height', h + p.top + p.bottom);
    
    this._root
      .attr('transform', 'translate('+p.left+','+p.top+')');
  }

  return this;
};

prototype.svg = function() {
  if (!this._svg) return null;

  var head = DOM.openTag('svg', dl.extend({
    'class':  'marks',
    'width':  this._width + this._padding.left + this._padding.right,
    'height': this._height + this._padding.top + this._padding.bottom,
  }, SVG.metadata));

  var foot = DOM.closeTag('svg');

  return head + this._svg.html() + foot;
};

prototype.updateDefs = function() {
  var svg = this._svg,
      all = this._defs,
      dgrad = dl.keys(all.gradient),
      dclip = dl.keys(all.clipping),
      defs = svg.select('defs'), grad, clip;

  // get or create svg defs block
  if (dgrad.length===0 && dclip.length===0) { defs.remove(); return; }
  if (defs.empty()) defs = svg.insert('defs', ':first-child');
  
  grad = defs.selectAll('linearGradient').data(dgrad, dl.identity);
  grad.enter().append('linearGradient').attr('id', dl.identity);
  grad.exit().remove();
  grad.each(function(id) {
    var def = all.gradient[id],
        grd = d3.select(this),
        stop;

    // set gradient coordinates
    grd.attr({x1: def.x1, x2: def.x2, y1: def.y1, y2: def.y2});

    // set gradient stops
    stop = grd.selectAll('stop').data(def.stops);
    stop.enter().append('stop');
    stop.exit().remove();
    stop.attr('offset', function(d) { return d.offset; })
        .attr('stop-color', function(d) { return d.color; });
  });
  
  clip = defs.selectAll('clipPath').data(dclip, dl.identity);
  clip.enter().append('clipPath').attr('id', dl.identity);
  clip.exit().remove();
  clip.each(function(id) {
    var def = all.clipping[id],
        cr = d3.select(this).selectAll('rect').data([1]);
    cr.enter().append('rect');
    cr.attr('x', 0)
      .attr('y', 0)
      .attr('width', def.width)
      .attr('height', def.height);
  });
};

prototype.render = function(scene, items) {
  if (items) {
    this.update(dl.array(items));
  } else {
    this.draw(this._root, scene, -1);
  }
  this.updateDefs();

  return this;
};

prototype.update = function(items) {
  var item, mark, el, i, n;

  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = marks[item.mark.marktype];
    item = mark.nested ? item.mark.items : item;
    el   = mark.nested ? item[0]._svg : item._svg;
    mark.update.call(this, el, item);
    this.style(el, item);
  }
};

prototype.draw = function(ctx, scene, index) {
  var mark = marks[scene.marktype];
  mark.draw.call(this, ctx, scene, index);
};

prototype.style = function(el, d) {
  var i, n, prop, name, value,
      o = dl.isArray(d) ? d[0] : d;
  if (o == null) return;

  for (i=0, n=SVG.styleProperties.length; i<n; ++i) {
    prop = SVG.styleProperties[i];
    name = SVG.styles[prop];
    value = o[prop];

    if (value == null) {
      if (name === 'fill') {
        el.style.setProperty(name, 'none', null);
      } else {
        el.style.removeProperty(name);
      }
    } else {
      if (value.id) {
        // ensure definition is included
        this._defs.gradient[value.id] = value;
        value = 'url(' + href + '#' + value.id + ')';
      }
      el.style.setProperty(name, value+'', null);
    }
  }
};

module.exports = SVGRenderer;
