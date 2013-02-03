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
  
  prototype.update = function(axes, scales, duration) {
    duration = duration || 0;
    var init = this._init; this._init = true;
    var dom = d3.selectAll("svg.axes").select("g");
    
    if (!init) {
      dom.selectAll('g.axis')
        .data(axes)
       .enter().append('g')
        .attr('class', function(d, i) { return 'axis axis-'+i; });
    }
    
    var sel = duration && init ? dom.transition(duration) : dom,
        width = this._width,
        height = this._height;

    sel.selectAll('g.axis')
      .attr('transform', function(axis,i) {
        var offset = axis.offset || 0, xy;
        switch(axis.orient()) {
          case 'left':   xy = [     -offset,  0]; break;
          case 'right':  xy = [width+offset,  0]; break;
          case 'bottom': xy = [0, height+offset]; break;
          case 'top':    xy = [0,       -offset]; break;
          default: xy = [0,0];
        }
        return 'translate('+xy[0]+', '+xy[1]+')';
      })
      .each(function(axis) {
        axis.scale(scales[axis.scaleName]);
        var s = d3.select(this);
        (duration && init
          ? s.transition().duration(duration)
          : s).call(axis);
      });    
  };
  
  return axes;
})();