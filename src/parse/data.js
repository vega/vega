vg.parse.data = function(spec, callback) {
  var model = {
    load: {},
    flow: {}
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
      model.load[d.name] = d.values;
    }
    
    if (d.transform) {
      model.flow[d.name] = vg.parse.dataflow(d);
    }
  });
  
  if (count === 0) setTimeout(callback, 1);
  return model;
};