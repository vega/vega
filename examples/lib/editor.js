var ved = {};

ved.select = function() {
  var sel = document.getElementById("sel_spec"),
      idx = sel.selectedIndex,
      uri = sel.options[idx].value;

  if (idx > 0) {
    d3.xhr(uri, function(error, response) {
      d3.select("#spec").property("value", response.responseText);
      ved.parse();
    });
  } else {
    d3.select("#spec").property("value", "");
  }
};

ved.format = function(event) {
  var el = d3.select("#spec"),
      spec = JSON.parse(el.property("value")),
      text = JSON.stringify(spec, null, 2);
  el.property("value", text);
};

ved.parse = function() {
  var spec, source;
  try {
    spec = JSON.parse(d3.select("#spec").property("value"));
  } catch (e) {
    console.log(e);
    return;
  }
  
  vg.parse.spec(spec, function(chart) {
    d3.select("#vis").selectAll("*").remove();
    (ved.view = chart("#vis")).update();
  });
};

ved.init = function() {
  // Specification drop-down menu
  var specs = [
    "arc",
    "area",
    "bar",
    "choropleth",
    "error",
    "force",
    "image",
    "map",
    "scatter",
    "stacked_area",
    "stacked_bar",
    "treemap",
    "wordcloud"
  ];
               
  var sel = d3.select("#sel_spec");
  sel.on("change", ved.select);
  sel.append("option").text("Custom");
  sel.selectAll("option.spec")
    .data(specs)
   .enter().append("option")
    .attr("value", function(d) { return "vega/"+d+".json"; })
    .text(function(d) { return d; });

  d3.select("#btn_spec_format").on("click", ved.format);
  d3.select("#btn_spec_parse").on("click", ved.parse);
};

window.onload = ved.init;