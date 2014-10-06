define(function(require, exports, module) {
  var vg = require('vega'),
      transforms = require('./transforms');

  return function parseData(model, spec, callback) {
    var count = 0,
        parseTransforms = transforms(model);

    function load(d) {
      return function(error, data) {
        if (error) {
          vg.error("LOADING FAILED: " + d.url);
        } else {
          d.values = vg.data.read(data.toString(), d.format);
          datasource(d);
        }
        if (--count === 0) callback();
      }
    }

    function datasource(d) {
      var pipeline = (d.transform||[]).map(parseTransforms),
          ds = model.data(d.name, pipeline);

      if(d.values) ds.data(d.values);

      // TODO: if d.source

      return ds;
    }

    // process each data set definition
    (spec || []).forEach(function(d) {
      if (d.url) {
        count += 1;
        vg.data.load(d.url, load(d)); 
      }
      else datasource(d);
    });

    if (count === 0) setTimeout(callback, 1);
    return spec;
  };
});