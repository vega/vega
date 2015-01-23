define(function(require, exports, module) {
  var changeset = require('../dataflow/changeset'), 
      build = require('./build');

  return function(model) {
    var node = null, tree = null;

    function scene(renderer) {
      if(!arguments.length) return tree;
      node = build(model, renderer, model._defs.marks, tree={});
      model.addListener(node);

      tree.fire = function(cs) {
        if(!cs) cs = changeset.create({}, true);
        model.graph.propagate(cs, node);
      };

      // Scale/invert a value using a top-level scale
      tree.scale = function(spec, value) {
        if(!spec.scale) return value;
        var scale = tree.items[0].scale(spec.scale);
        if(!scale) return value;

        return spec.invert ? scale.invert(value) : scale(value);
      };

      return tree;
    };    

    return scene;
  };
});