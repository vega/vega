vg.parse.spec = function(spec, callback) {
  
  function parse(spec) {
    var model = {
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
        .model(model)
        .data(model.data.load)
        .data(input);
    };
  }
  
  vg.isObject(spec) ? parse(spec) :
    d3.json(spec, function(error, json) {
      error ? vg.error(error) : parse(json);
    });
};