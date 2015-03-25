function trellis() {
  var margin = {top: 0, right: 13, bottom: 17, left: 95},
      width  = 310 - margin.left - margin.right,
      height = 740 - margin.top  - margin.bottom; 

  var g, x, y, c,
      xAxis, yAxis,
      variety, site, siteData,
      svg;

  this.init = function() {
    g = d3.scale.ordinal().rangeBands([height, 0]);
    c = d3.scale.category10();
    x = d3.scale.linear().range([0, width]);
    y = d3.scale.ordinal();

    xAxis = d3.svg.axis().orient("bottom");
    yAxis = d3.svg.axis().orient("left");
  };

  this.update = function(data) {
    variety = d3.nest()
      .key(function(d) { return d.variety; })
      .rollup(function(leaves) { return d3.median(leaves, function(d) { return d.yield }); })
      .entries(data)
      .sort(function(a, b) { return b.values - a.values });

    site = d3.nest()
      .key(function(d) { return d.site; })
      .rollup(function(leaves) { return d3.median(leaves, function(d) { return d.yield }); })
      .entries(data)
      .sort(function(a, b) { return b.values - a.values });

    siteData = d3.nest()
      .key(function(d) { return d.site; })
      .map(data, d3.map);

    g.domain(site.map(function(d) { return d.key }));
    x.domain([0, d3.max(data.map(function(d) { return d.yield }))]);
    y.domain(variety.map(function(d) { return d.key })).rangePoints([0, g.rangeBand()]);
    c.domain(data.map(function(d) { return d.year }));

    xAxis.scale(x);
    yAxis.scale(y);

    svg = d3.select("body").selectAll("svg")
      .data(site);

    svg.enter().append("svg")
      .attr("width", width+margin.left+margin.right)
      .attr("height", g.rangeBand())
      .append("g")
        .attr("transform", "translate("+margin.left+","+margin.top+")");

    svg.each(multiple);
    svg.exit().remove();
  };

  function multiple(site, i) {
    var svg = d3.select(this).select('g');

    var rect = svg.select('rect');
    if(rect.empty()) {
      svg.append('rect')
        .attr('x', 0)
        .attr('width', width)
        .attr('height', g.rangeBand())
        .attr('fill', 'white')
        .attr('stroke', '#000');

      svg.append("g").attr("class", "x axis");
      svg.append("g").attr("class", "y axis");
    }

    svg.select('.y.axis').call(yAxis);
    if(i == siteData.size() - 1) svg.select('.x.axis').call(xAxis);

    var data = siteData.get(site.key);
    var points = svg.selectAll('.point')
      .data(data);

    points.enter().append('circle')
      .attr('class', 'point');

    points.attr('cx', function(d) { return x(d.yield) })
      .attr('cy', function(d) { return y(d.variety) })
      .attr('r', 4)
      .style('fill', 'transparent')
      .style('stroke', function(d) { return c(d.year) })
      .style('stroke-width', '2px');

  }
}

trellis.data = 'data/barley.json';
module.exports = trellis;