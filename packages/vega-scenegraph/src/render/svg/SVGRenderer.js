var d3 = require('d3'),
    dl = require('datalib'),
    util = require('./marks/util'),
    marks = require('./marks'),
    Renderer = require('../Renderer');

function SVGRenderer() {
  Renderer.call(this);
}

var base = Renderer.prototype;
var prototype = (SVGRenderer.prototype = Object.create(base));

prototype.initialize = function(el, width, height, padding) {
  if (el) {
    // remove any existing svg elements
    var sel = d3.select(el);
    sel.selectAll('svg.marks').remove();
    // create svg element and initialize attributes
    this._svg = sel.append('svg').attr('class', 'marks');
    // set the svg root group
    this._root = this._svg.append('g');
  }

  // create the svg definitions cache
  this._defs = {
    gradient: {},
    clipping: {}
  };

  // set background color if defined
  this.background(this._bgcolor);

  return base.initialize.call(this, el, width, height, padding);
};

prototype.background = function(bgcolor) {
  if (this._svg) {
    this._svg.style('background-color', bgcolor);
  }
  return base.background.call(this, bgcolor);
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
  util.defs = this._defs; // stash defs to collect clips/gradients

  if (items) {
    this.update(dl.array(items));
  } else {
    this.draw(this._root, scene, -1);
  }
  this.updateDefs();

  util.defs = null;
};

prototype.update = function(items) {
  var item, node, mark, i, n;

  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    node = item._svg;
    mark = marks[item.mark.marktype];

    item = mark.nested ? item.mark.items : item;
    mark.update.call(node, item);
    util.style.call(node, item);
  }
};

prototype.draw = function(ctx, scene, index) {
  var mark = marks[scene.marktype];
  mark.draw.call(this, ctx, scene, index);
};

module.exports = SVGRenderer;
