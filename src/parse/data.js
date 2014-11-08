define(function(require, exports, module) {
  var parseTransforms = require('./transforms'),
      parseModify = require('../transforms/modify'),
      util = require('../util/index'),
      load = require('../util/load'),
      read = require('../util/read');

  return function parseData(model, spec, callback) {
    var count = 0;

    function loaded(d) {
      return function(error, data) {
        if (error) {
          util.error("LOADING FAILED: " + d.url);
        } else {
          d.values = read(data.toString(), d.format);
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
        load(d.url, loaded(d)); 
      }
      else datasource(d);
    });

    if (count === 0) setTimeout(callback, 1);
    return spec;
  };
});