define(function(require, exports, module) {
  var vg = require('vega'),
      parseTransforms = require('./transforms'),
      parseModify = require('../transforms/modify');

  return function parseData(model, spec, callback) {
    var count = 0;

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
      var transform = (d.transform||[]).map(function(t) { return parseTransforms(model, t) }),
          mod = (d.modify||[]).map(function(m) { return parseModify(model, m) }),
          ds = model.data(d.name, mod.concat(transform));

      if(d.values) ds.data(d.values);
      else if(d.source) model.data(d.source).addListener(ds);

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