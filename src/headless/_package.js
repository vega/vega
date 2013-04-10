vg.headless = (function() {
  
  var svgNS = 'version="1.1" xmlns="http://www.w3.org/2000/svg" ' +
    'xmlns:xlink="http://www.w3.org/1999/xlink"';

  function extractSVG(view) {
    var p = view.padding(),
        w = view.width()  + (p ? p.left + p.right : 0),
        h = view.height() + (p ? p.top + p.bottom : 0),
        svg = "";

    // build svg text
    d3.selectAll("svg").each(function() {
      svg = this.innerHTML + svg;
    });
    svg = svg.replace(/ href=/g, " xlink:href="); // requires a hack. sigh.

    return {
      svg : '<svg '
            + 'width="' + w + '" '
            + 'height="' + h + '" '
          + svgNS + '>' + svg + '</svg>'
    };
  }

  function extractCanvas(view) {
    return {canvas: view.canvas()};
  }

  function render(opt, callback) {
    function draw(chart) {
      try {
        // create and render view
        var view = chart({
          data: opt.data,
          renderer: opt.renderer
        }).update();

        if (opt.renderer === "svg") {
          // extract rendered svg
          callback(null, extractSVG(view));
        } else {
          // extract rendered canvas
          var r = view.renderer();
          if (r.pendingImages() === 0) {
            // if no images loading, return now
            callback(null, extractCanvas(view));
          } else {
            // if images loading, poll until ready
            function wait() {
              if (r.pendingImages() === 0) {
                view.render(); // re-render with all images
                callback(null, extractCanvas(view));
              } else setTimeout(wait, 10);
            }
            wait();
          }
        }
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