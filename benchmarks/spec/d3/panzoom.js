function panzoom() { 
  var cx = 960, cy = 600;
  var padding = { "top": 20, "right": 30, "bottom": 30, "left": 45 };
  var size = { "width":  cx - padding.left - padding.right,
               "height": cy - padding.top  - padding.bottom };

  var x, y, vis, plot;

  this.init = function() {
    x = d3.scale.linear()
        .domain([-1.5, 1.5])
        .range([0, size.width]);
    
    // y-scale (inverted domain)
    y = d3.scale.linear()
        .domain([1, -1])
        .range([0, size.height]);

    vis = d3.select('body').append("svg")
          .attr("width",  cx)
          .attr("height", cy)
        .append("g")
          .attr("transform", "translate(" + padding.left + "," + padding.top + ")");

    plot = vis.append("rect")
          .attr("width", size.width)
          .attr("height", size.height)
          .attr("fill", "none")
          .attr("pointer-events", "all")
    
    vis.call(d3.behavior.zoom().x(x).y(y).on("zoom", redraw()));

    vis.append("svg")
          .attr("top", 0)
          .attr("left", 0)
          .attr("width", size.width)
          .attr("height", size.height)
          .attr("viewBox", "0 0 "+ size.width + " " + size.height);

    redraw()();
  };

  this.update = function(data) {
    var circle = vis.select("svg").selectAll("circle")
        .data(data);
   
    circle.enter().append("circle")
        .attr("cx", function(d) { return x(d.x); })
        .attr("cy", function(d) { return y(d.y); })
        .attr("r", 10.0);
   
    circle
        .attr("cx", function(d) { return x(d.x); })
        .attr("cy", function(d) { return y(d.y); });
   
    circle.exit().remove();
  }

  function redraw() {
    return function() {
      var tx = function(d) { 
        return "translate(" + x(d) + ",0)"; 
      },
      ty = function(d) { 
        return "translate(0," + y(d) + ")";
      },
      stroke = function(d) { 
        return d ? "#ccc" : "#666"; 
      },
      fx = x.tickFormat(10),
      fy = y.tickFormat(10);
   
      // Regenerate x-ticks…
      var gx = vis.selectAll("g.x")
          .data(x.ticks(10), String)
          .attr("transform", tx);
   
      gx.select("text")
          .text(fx);
   
      var gxe = gx.enter().insert("g", "a")
          .attr("class", "x")
          .attr("transform", tx);
   
      gxe.append("line")
          .attr("stroke", stroke)
          .attr("y1", 0)
          .attr("y2", size.height);
   
      gxe.append("text")
          .attr("class", "axis")
          .attr("y", size.height)
          .attr("dy", "1em")
          .attr("text-anchor", "middle")
          .text(fx);
   
      gx.exit().remove();
   
      // Regenerate y-ticks…
      var gy = vis.selectAll("g.y")
          .data(y.ticks(10), String)
          .attr("transform", ty);
   
      gy.select("text")
          .text(fy);
   
      var gye = gy.enter().insert("g", "a")
          .attr("class", "y")
          .attr("transform", ty);
   
      gye.append("line")
          .attr("stroke", stroke)
          .attr("x1", 0)
          .attr("x2", size.width);
   
      gye.append("text")
          .attr("class", "axis")
          .attr("x", -3)
          .attr("dy", ".35em")
          .attr("text-anchor", "end")
          .text(fy);
   
      gy.exit().remove();
      plot.call(d3.behavior.zoom().x(x).y(y).on("zoom", redraw()));
      update(window.data);    
    }
  }
}

panzoom.data = 'data/points.json';
module.exports = panzoom;