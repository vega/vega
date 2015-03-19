var d3 = require('d3');

var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

function random(N, C) {
  var out = [];
  for (var i=0; i<N; ++i) {
    var o = {};
    o.idx = i;
    o.x = "c" + ~~(C*(i/N));
    o.y = C * Math.random();
    o.z = o.y + C * Math.random();
    out.push(o);
  }
  return out;
}

module.exports = function(data) {
  data = random(10000, 500);

  var xAcc = function(d) { return d.z },
      xScale = d3.scale.linear()
        .domain([d3.min(data, xAcc), d3.max(data, xAcc)])
        .range([0, width]),
      xAxis = d3.svg.axis().scale(xScale).orient("bottom");

  var yAcc = function(d) { return d.y },
      yScale = d3.scale.linear()
        .domain([d3.min(data, yAcc), d3.max(data, yAcc)])
        .range([height, 0]),
      yAxis = d3.svg.axis().scale(yScale).orient("left");

  var cAcc = function(d) { return d.x },
      cScale = d3.scale.ordinal()
        .domain(d3.set(data.map(cAcc)).values())
        .range(["#800", "#080", "#008"]);

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // x-axis
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (height-margin.bottom) + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("Sepal Width");

  // y-axis
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Petal Length");

  // draw dots
  svg.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d) { return xScale(d.z) })
      .attr("cy", function(d) { return yScale(d.y) })
      .style("fill", function(d) { return cScale(d.x) });
};