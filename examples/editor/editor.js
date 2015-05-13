var ved = {
  version: 0.1,
  data: undefined,
  renderType: "canvas"
};

ved.params = function() {
  return location.search.slice(1)
    .split("&")
    .map(function(x) { return x.split("="); })
    .reduce(function(a, b) {
      a[b[0]] = b[1]; return a;
    }, {});
};

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

ved.renderer = function() {
  var sel = document.getElementById("sel_render"),
      idx = sel.selectedIndex,
      ren = sel.options[idx].value;

  ved.renderType = ren;
  ved.parse();
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

  ved.spec = spec;
  vg.parse.spec(spec, function(chart) {
    d3.select("#vis").selectAll("*").remove();
    var view = chart({
      el: "#vis",
      data: ved.data,
      renderer: ved.renderType
    });
    (ved.view = view).update();
  });
};

ved.resize = function(event) {
  var h = window.innerHeight - 30;
  d3.select("#spec").style("height", h+"px");
};

ved.init = function() {
  // Set base directory
  vg.config.load.baseURL = "../";
  
  // Specification drop-down menu               
  var sel = d3.select("#sel_spec");
  sel.on("change", ved.select);
  sel.append("option").text("Custom");

  var st = sel.append("optgroup")
    .attr("label", "Static");

  st.selectAll("option.spec")
    .data(STATIC_SPECS)
   .enter().append("option")
    .attr("value", function(d) { return "../spec/"+d+".json"; })
    .text(function(d) { return d; });

  var interactive = sel.append("optgroup")
    .attr("label", "Interactive");

  interactive.selectAll("option.spec")
    .data(INTERACTIVE_SPECS)
   .enter().append("option")
    .attr("value", function(d) { return "../spec/"+d+".json"; })
    .text(function(d) { return d; });

  // Renderer drop-down menu
  var ren = d3.select("#sel_render");
  ren.on("change", ved.renderer)
  ren.selectAll("option")
    .data(["Canvas", "SVG"])
   .enter().append("option")
    .attr("value", function(d) { return d.toLowerCase(); })
    .text(function(d) { return d; });

  // Initialize application
  d3.select("#btn_spec_format").on("click", ved.format);
  d3.select("#btn_spec_parse").on("click", ved.parse);
  d3.select(window).on("resize", ved.resize);
  ved.resize();
  
  // Handle application parameters
  var p = ved.params();
  if (p.spec) {
    var idx = STATIC_SPECS.concat(INTERACTIVE_SPECS).indexOf(p.spec) + 1;
    if (idx > 0) {
      sel.node().selectedIndex = idx;
      ved.select();
    }
  }

  if (p.renderer) {
    var ren = document.getElementById("sel_render");
    ren.selectedIndex = p.renderer === "SVG" || p.renderer === "svg" ? 1 : 0;
    ved.renderer();
  }
};

window.onload = ved.init;
