var requirejs = require('requirejs'),
    vg = require('vega'),
    asciitree = require('ascii-tree');

function printData(data, facetFields, valueFields) {
  data.forEach(function(x, i) {
    console.log(x._id, facetFields.map(function(f) { return f+": "+vg.accessor(f)(x); }).join(", "));
    (x.values||[]).forEach(function(v, j) {
      console.log("  ", v._id, valueFields.map(function(f) { return f+": "+vg.accessor(f)(v); }).join(", "));
    })
  });
  console.log("---");
}

function printScene(tree, visualProperties) {
  var str = "";

  function item(node) {
    var str = "item#" + (node.datum._id||"sentinel");
    visualProperties.forEach(function(p) { 
      var v = node[p];
      if(v !== undefined) str += " " + p + ":" + (vg.isNumber(v) ? Math.floor(v) : v);
    });
    return str;
  }

  function traverse(node, level) {
    str+= "\n" + Array(level+1).join("#") + " ";
    if(node.marktype) str+= node.marktype + (node.def.from ? ":"+node.def.from : "");
    else str+= item(node);

    (node.items||[]).forEach(function(n) { traverse(n, level+1); });
  }
  traverse(tree, 1);

  console.log(asciitree.generate(str));
  console.log("===###===");
}

requirejs.config({
    //Pass the top-level main.js/index.js require
    //function to requirejs so that node modules
    //are loaded relative to the top-level JS file.
    nodeRequire: require
});

requirejs(['spec/index', 'suite/index', './runner', '../src/parse/spec'], function(specs, suites, runner, parseSpec) {
  var name  = process.argv[2], 
      spec  = specs[name],
      suite = suites[name];

  // Since we're only testing that the dataflow and scene graphs are 
  // correctly constructed, supply a simple viewFactory that has a
  // dummy renderer and returns the model for us to pulse manually.
  var viewFactory = function(model) { 
    model.scene(new model.Node(function(input) { global.debug(input, ["rendering"]); return input; }));
    return model; 
  };

  parseSpec(spec, function(model) {
    var cb = function(id, task, time, ds) {
      console.log("step: "+id, "time: "+time, 
        "data.length: "+ds.data().length, "-- "+task.label);
      printData(ds.data(), suite.facetFields, suite.valueFields);
      printScene(model.scene(), suite.visualProperties); 
    }

    suite.tasks.forEach(runner(model, name, spec, suite, cb));
  }, viewFactory);
})