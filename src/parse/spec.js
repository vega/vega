vg.parse.spec = function(spec, callback) {
  
  function parse(spec) {
    var defs = {
      scales: spec.scales,
      axes: spec.axes,
      marks: vg.parse.marks(spec.marks),
      data: vg.parse.data(spec.data, function() { callback(chart); })
    };

    var chart = function(el, input) {
      return new vg.View()
        .width(spec.width || 500)
        .height(spec.height || 500)
        .padding(spec.padding || {top:20, left:20, right:20, bottom:20})
        .viewport(spec.viewport || null)
        .initialize(el)
        .defs(defs)
        .data(defs.data.load)
        .data(input)
        .on("mouseover", function(evt, item) {
          view.update("hover", item);
        })
        .on("mouseout", function(evt, item) {
          view.update("update", item);
        });
    };
  }
  
  vg.isObject(spec) ? parse(spec) :
    d3.json(spec, function(error, json) {
      error ? vg.error(error) : parse(json);
    });
};