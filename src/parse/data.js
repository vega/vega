vg.parse.data = function(spec, callback) {
  var model = {
    defs: spec,
    load: {},
    flow: {},
    source: {}
  };
  var count = 0;
  
  function load(d) {
    return function(error, resp) {
      if (error) {
        vg.error("LOADING ERROR: " + d.url);
      } else {
        model.load[d.name] = vg.data.read(resp.responseText, d.format);
      }
      if (--count === 0) callback();
    }
  }
  
  (spec || []).forEach(function(d) {
    if (d.url) {
      count += 1;
      vg.log("LOADING: " + d.url);
      d3.xhr(d.url, load(d)); 
    }
     
    if (d.values) {
      if (d.format && d.format.parse) {
        // run specified value parsers
        vg.data.read.parse(d.values, d.format.parse);
      }
      model.load[d.name] = d.values;
    }
    
    if (d.source) {
      var list = model.source[d.source] || (model.source[d.source] = []);
      list.push(d.name);
    }
    
    if (d.transform) {
      model.flow[d.name] = vg.parse.dataflow(d);
    }
  });
  
  if (count === 0) setTimeout(callback, 1);
  return model;
};