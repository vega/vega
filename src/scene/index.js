define(function(require, exports, module) {
  var changeset = require('../core/changeset'), 
      build = require('./build');

  return function(model) {
    var node = null, tree = null;

    function scene(renderer) {
      if(!arguments.length) return tree;
      node = build(model, renderer, model._defs.marks, tree={});
      model.addListener(node);
      return model;
    };

    function fire() {
      var c = changeset.create({}, true);
      model.graph.propagate(c, node);
    };  

    scene.fire = fire;
    return scene;
  };
});