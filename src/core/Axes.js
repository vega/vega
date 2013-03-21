vg.Axes = (function() {  
  var axes = function() {
    this._svg = null;
    this._el = null;
    this._init = false;
  };
  
  var prototype = axes.prototype;
  
  prototype.initialize = function(el, width, height, pad) {
    this._el = el;
    this._width = width;
    this._height = height;
    this._padding = pad;

    // select axis svg element
    var axes = d3.select(el)
      .selectAll("svg.axes")
      .data([1]);
    
    // create new svg element if needed
    axes.enter()
      .append("svg")
      .style("pointer-events", "none");
    
    // initialize svg attributes
    axes
      .attr("class", "axes")
      .attr("width", width + pad.left + pad.right)
      .attr("height", height + pad.top + pad.bottom)
      .style({position:"absolute", left:0, top:0});

    var g = axes.selectAll("g").data([1]);
    g.enter().append("g");
    g.attr("transform", "translate("+pad.left+","+pad.top+")");

    this._init = false;
    return this;
  };
    
  prototype.element = function() {
    return this._el;
  };
  
  prototype.update = function(model, duration, ease) {
    duration = duration || 0;
    ease = ease || "cubic-in-out";
    var init = this._init; this._init = true;
    var dom = d3.select(this._el).selectAll("svg.axes").select("g");
    var axes = collectAxes(model.scene(), 0, 0, []);
    
    if (!init) {
      dom.selectAll('g.axis')
        .data(axes)
       .enter().append('g')
        .attr('class', function(d, i) { return 'axis axis-'+i; });
    }
    
    var sel = duration && init ? dom.transition(duration).ease(ease) : dom,
        w = this._width,
        h = this._height;

    sel.selectAll('g.axis')
      .attr('transform', function(a, i) {
        var offset = a.axis.offset || 0,
            width  = a.group.width || w,
            height = a.group.height || h,
            xy;

        switch(a.axis.orient()) {
          case 'left':   xy = [     -offset,  0]; break;
          case 'right':  xy = [width+offset,  0]; break;
          case 'bottom': xy = [0, height+offset]; break;
          case 'top':    xy = [0,       -offset]; break;
          default: xy = [0,0];
        }
        return 'translate('+(xy[0]+a.x)+', '+(xy[1]+a.y)+')';
      })
      .each(function(a) {
        a.axis.scale(a.group.scales[a.axis.scaleName]);
        var s = d3.select(this);
        (duration && init
          ? s.transition().duration(duration)
          : s).call(a.axis);
      });    
  };
  
  function collectAxes(scene, x, y, list) {
    var i, j, len, axes, group, items, xx, yy;

    for (i=0, len=scene.items.length; i<len; ++i) {
      group = scene.items[i];
      xx = x + (group.x || 0);
      yy = y + (group.y || 0);

      // collect axis
      if (axes = group.axes) {
        for (j=0; j<axes.length; ++j) {
          list.push({axis: axes[j], group: group, x: xx, y: yy});
        }
      }

      // recurse
      for (items=group.items, j=0; j<items.length; ++j) {
        if (items[j].marktype === vg.scene.GROUP) {
          collectAxes(items[j], xx, yy, list);
        }
      }
    }

    return list;
  }
  
  return axes;
})();