module.exports = function() {
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  var xAcc, xScale, xAxis,
      yAcc, yScale, yAxis,
      cAcc, cScale,
      svg, dot;

  this.init = function() {
    xAcc   = function(d) { return d.z };
    xScale = d3.scale.linear().range([0, width]);
    xAxis  = d3.svg.axis().orient("bottom");

    yAcc   = function(d) { return d.y };
    yScale = d3.scale.linear().range([height, 0]);
    yAxis  = d3.svg.axis().orient("left");

    cAcc   = function(d) { return d.x };
    cScale = d3.scale.ordinal().range(["#800", "#080", "#008"]);

    svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // x-axis
    svg.append("g")
        .attr("class", "x_axis")
        .attr("transform", "translate(0," + (height-margin.bottom) + ")")
      .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Sepal Width");

    // y-axis
    svg.append("g")
        .attr("class", "y_axis")
      .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Petal Length");
  }

  this.update = function(data) {
    xScale.domain([d3.min(data, xAcc), d3.max(data, xAcc)]);
    xAxis.scale(xScale);
    svg.select('g.x_axis').call(xAxis);

    yScale.domain([d3.min(data, yAcc), d3.max(data, yAcc)]);
    yAxis.scale(yScale);
    svg.select('g.y_axis').call(yAxis);

    // draw dots
    dot = svg.selectAll(".dot")
        .data(data);

    dot.enter().append("circle")
        .attr("class", "dot");

    dot.attr("r", 3.5)
      .attr("cx", function(d) { return xScale(d.z) })
      .attr("cy", function(d) { return yScale(d.y) })
      .style("fill", function(d) { return cScale(d.x) })
      .style("opacity", 0.5)
      .style("stroke", "transparent");

    dot.exit().remove();
  }
};