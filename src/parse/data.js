vg.parse.data = function(spec, callback) {
  var model = {
    defs: spec,
    load: {},
    flow: {},
    deps: {},
    source: {},
    sorted: null
  };

  var count = 0;
  
  function load(d) {
    return function(error, data) {
      if (error) {
        vg.error("LOADING FAILED: " + d.url);
      } else {
        try {
          model.load[d.name] = vg.data.read(data.toString(), d.format);
        } catch (err) {
          vg.error("UNABLE TO PARSE: " + d.url + ' ' + err.toString());
        }
      }
      if (--count === 0) callback();
    };
  }
  
  // process each data set definition
  (spec || []).forEach(function(d) {
    if (d.url) {
      count += 1;
      vg.data.load(d.url, load(d)); 
    } else if (d.values) {
      model.load[d.name] = vg.data.read(d.values, d.format);
    } else if (d.source) {
      (model.source[d.source] || (model.source[d.source] = [])).push(d.name);
    }
    
    if (d.transform) {
      var flow = vg.parse.dataflow(d);
      model.flow[d.name] = flow;
      flow.dependencies.forEach(function(dep) {
        (model.deps[dep] || (model.deps[dep] = [])).push(d.name);
      });
    }
  });
  
  // topological sort by dependencies
  var names = (spec || []).map(vg.accessor("name")),
      order = [], v = {}, n;
  function visit(n) {
    if (v[n] === 1) return; // not a DAG!
    if (!v[n]) {
      v[n] = 1;
      (model.source[n] || []).forEach(visit);
      (model.deps[n] || []).forEach(visit);
      v[n] = 2;
      order.push(n);
    }
  }
  while (names.length) { if (v[n=names.pop()] !== 2) visit(n); }
  model.sorted = order.reverse();
  
  if (count === 0) setTimeout(callback, 1);
  return model;
};