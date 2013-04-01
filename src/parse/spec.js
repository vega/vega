vg.parse.spec = function(spec, callback) {
  
  function parse(spec) {
    var defs = {
      marks: vg.parse.marks(spec),
      data: vg.parse.data(spec.data, function() { callback(chart); })
    };

    var chart = function(el, input, renderer) {
      return new vg.View()
        .width(spec.width || 500)
        .height(spec.height || 500)
        .padding(parsePadding(spec.padding))
        .viewport(spec.viewport || null)
        .renderer(renderer || "canvas")
        .initialize(el)
        .defs(defs)
        .data(defs.data.load)
        .data(input)
        .on("mouseover", function(evt, item) {
          this.update({props:"hover", items:item});
        })
        .on("mouseout", function(evt, item) {
          this.update({props:"update", items:item});
        });
    };
  }
  
  function parsePadding(pad) {
    if (vg.isObject(pad)) return pad;
    var p = vg.isNumber(pad) ? pad : 20;
    return {top:p, left:p, right:p, bottom:p};
  }
  
  vg.isObject(spec) ? parse(spec) :
    d3.json(spec, function(error, json) {
      error ? vg.error(error) : parse(json);
    });
};