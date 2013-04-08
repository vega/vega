vg.headless = (function() {

  var styles = {
    "fill": 1,
    "fill-opacity": 1,
    "stroke": 1,
    "stroke-opacity": 1,
    "stroke-width": 1,
    "opacity": 1,
    "font": 1,
    "font-family": 1,
    "font-size": 1,
    "font-style": 1,
    "text-anchor": 1
  };

  function extractSVG(spec, view) {
    var p = spec.padding,
        w = spec.width  + (p ? p.left + p.right : 0),
        h = spec.height + (p ? p.top + p.bottom : 0),
        svg = "";

    // set axis styles
    d3.selectAll(".axis path, .axis line").attr({
      "fill": "none",
      "stroke": "black",
      "stroke-width": "1px"
    });
    d3.selectAll(".axis text").attr({
      "font-family": "Helvetica Neue, Helvetica, Arial, sans-serif",
      "font-size": "10px"
    });

    // map styles to attrs for backward compatibility
    d3.selectAll("svg").selectAll("*").each(function() {
      var i, n, s;
      for (i=0, n=this.style.length; i<n; ++i) {
        s = this.style[i];
        if (styles[s]) this.setAttribute(s, this.style.getPropertyValue(s));
      }
      this.setAttribute("style", "");
    });

    // build svg text
    d3.selectAll("svg").each(function() {
      svg = this.innerHTML + svg;
    });
    // removing the style attribute in jsdom is error prone, hence the hack
    svg = svg.replace(/ style=""/g, "");

    return {
      svg : '<svg '
            + 'width="' + w + '" '
            + 'height="' + h + '"'
          + '>' + svg + '</svg>'
    };
  }

  function extractCanvas(spec, view) {
    return {canvas: view.canvas()};
  }

  function render(opt, callback) {
    function draw(chart) {
      try {
        var view = chart({
          data: opt.data,
          renderer: opt.renderer
        }).update();
      
        var extract = opt.renderer === "svg" ? extractSVG : extractCanvas;
        callback(null, extract(opt.spec, view));
      } catch (err) {
        callback(err, null);
      }
    }
    vg.parse.spec(opt.spec, draw, vg.HeadlessView.Factory);
  }

  function convert(spec, type, callback) {
    type = type || "canvas";
    var opt = {
      renderer: type,
      spec:     spec,
      data:     null
    };
    render(opt, callback);
  }

  return {
    convert: convert,
    render:  render
  };

})();