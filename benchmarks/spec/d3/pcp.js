function pcp() {
  var margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  var x, y, line, axes, 
      svg, dimensions;

  // Returns the path for a given data point.
  function path(d) {
    return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
  }

  this.init = function() {
    x = d3.scale.ordinal().rangePoints([0, width], 1);
    y = {};

    line = d3.svg.line();
    axes = d3.svg.axis().orient("left");

    svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  };

  this.update = function(data) {
    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = d3.keys(data[0]).filter(function(d) {
      return d != "name" && (y[d] = d3.scale.linear()
          .domain(d3.extent(data, function(p) { return +p[d]; }))
          .range([height, 0]));
    }));

    // Add blue cars lines for focus.
    var cars = svg.selectAll("path.cars")
        .data(data);
    cars.enter().append("path")
      .attr("class", "cars");
    cars.attr("d", path);
    cars.exit().remove();

    var dims = svg.selectAll(".dimension")
      .data(dimensions);

    dims.enter().append("g")
      .attr("class", "dimension");
    dims.attr("transform", function(d) { return "translate(" + x(d) + ")"; });
    dims.exit().remove();

    var axis = dims.select('g.axis');
    if(axis.empty()) {
      axis = dims.append('g')
        .attr('class', 'axis');

      axis.append('text')
        .attr('class', 'title')
        .attr('y', -9)
        .style('text-anchor', 'middle');
    } 

    axis.select('.title').text(function(d) { return d; });
    axis.each(function(d) { d3.select(this).call(axes.scale(y[d])); });
  };
}

pcp.data = 'data/cars.json';
module.exports = pcp;