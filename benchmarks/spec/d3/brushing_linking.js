function splom() {
  var width = 960,
      size = 150,
      padding = /*19.5*/ 25;

  var x = d3.scale.linear()
      .range([padding / 2, size - padding / 2]);

  var y = d3.scale.linear()
      .range([size - padding / 2, padding / 2]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .ticks(5);

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(5)
      .tickPadding(-0.5);

  var color = d3.scale.category10();

  var sheet = (function() {
    // Create the <style> tag
    var style = document.createElement("style");

    // Add a media (and/or media query) here if you'd like!
    // style.setAttribute("media", "screen")
    // style.setAttribute("media", "only screen and (max-width : 1024px)")

    // WebKit hack :(
    style.appendChild(document.createTextNode(""));

    // Add the <style> element to the page
    document.head.appendChild(style);

    return style.sheet;
  })();

  function addCSSRule(sheet, selector, rules, index) {
    if("insertRule" in sheet) {
      sheet.insertRule(selector + "{" + rules + "}", index);
    }
    else if("addRule" in sheet) {
      sheet.addRule(selector, rules, index);
    }
  }

  this.init = function() {
    addCSSRule(sheet, 'circle', 'fill-opacity: .7;');
    addCSSRule(sheet, 'circle.hidden', 'fill: grey !important;');
    addCSSRule(sheet, '.extent', 'fill: #000; fill-opacity: .125; stroke: #fff;');
    addCSSRule(sheet, '.frame', 'fill: none; stroke: black; stroke-opacity:0.25;');
  };

  this.update = function(data) {
    var domainByTrait = {},
        traits = d3.keys(data[0]).filter(function(d) { return d !== "species"; }),
        n = traits.length;

    traits.forEach(function(trait) {
      domainByTrait[trait] = d3.extent(data, function(d) { return d[trait]; });
    });

    //xAxis.tickSize(6);
    //xAxis.tickPadding(size * n - 7)
    //yAxis.tickSize(6);

    var brush = d3.svg.brush()
        .x(x)
        .y(y)
        .on("brushstart", brushstart)
        .on("brush", brushmove);

    var svg = d3.select("body").append("svg")
        .attr("width", size * n + padding)
        .attr("height", size * n + padding)
      .append("g")
        .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

    svg.selectAll(".x.axis")
        .data(cross(traits, traits))
      .enter().append("g")
        .attr("class", "x axis")
        .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + ((n - d.j) * size - (padding/2)) + ")"; })
        .each(function(d) { x.domain(domainByTrait[d.x]); d3.select(this).call(xAxis); });

    svg.selectAll(".y.axis")
        .data(cross(traits, traits))
      .enter().append("g")
        .attr("class", "y axis")
        .attr("transform", function(d, i) { return "translate(" + ((n - d.i - 1) * size + (padding / 2)) + "," + d.j * size + ")"; })
        .each(function(d) { y.domain(domainByTrait[d.y]); d3.select(this).call(yAxis); });

    var cell = svg.selectAll(".cell")
        .data(cross(traits, traits))
      .enter().append("g")
        .attr("class", "cell")
        .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
        .each(plot);

    cell.call(brush);

    function plot(p) {
      var cell = d3.select(this);

      x.domain(domainByTrait[p.x]);
      y.domain(domainByTrait[p.y]);

      cell.append("rect")
          .attr("class", "frame")
          .attr("x", padding / 2)
          .attr("y", padding / 2)
          .attr("width", size - padding)
          .attr("height", size - padding);

      cell.selectAll("circle")
          .data(data)
        .enter()
        .append("circle")
          .attr("cx", function(d) { return x(d[p.x]); })
          .attr("cy", function(d) { return y(d[p.y]); })
          .attr("r", 3)
          .style("fill", function(d) { return color(d.species); })
          .classed("hidden", true);
    }

    var brushCell;

    // Clear the previously-active brush, if any.
    function brushstart(p) {
      if (brushCell !== this) {
        d3.select(brushCell).call(brush.clear());
        x.domain(domainByTrait[p.x]);
        y.domain(domainByTrait[p.y]);
        brushCell = this;
      }
    }

    // Highlight the selected circles.
    function brushmove(p) {
      var e = brush.extent();
      svg.selectAll("circle").classed("hidden", function(d) {
        return e[0][0] > d[p.x] || d[p.x] > e[1][0]
            || e[0][1] > d[p.y] || d[p.y] > e[1][1];
      });
    }

    function cross(a, b) {
      var c = [], n = a.length, m = b.length, i, j;
      for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
      return c;
    }
  };
}

splom.data = 'data/iris.json';
module.exports = splom;