define(function(require, exports, module) {
  var parseTransforms = require('./transforms'),
      parseModify = require('../transforms/modify'),
      util = require('../util/index'),
      load = require('../util/load'),
      read = require('../util/read');

  var parseData = function(model, spec, callback) {
    var count = 0;

    function loaded(d) {
      return function(error, data) {
        if (error) {
          util.error("LOADING FAILED: " + d.url);
        } else {
          model.data(d.name).values(read(data.toString(), d.format));
        }
        if (--count === 0) callback();
      }
    }

    // process each data set definition
    (spec || []).forEach(function(d) {
      if (d.url) {
        count += 1;
        load(d.url, loaded(d)); 
      }
      parseData.datasource(model, d);
    });

    if (count === 0) setTimeout(callback, 1);
    return spec;
  };

  parseData.datasource = function(model, d) {
    var transform = (d.transform||[]).map(function(t) { return parseTransforms(model, t) }),
        mod = (d.modify||[]).map(function(m) { return parseModify(model, m, d) }),
        ds = model.data(d.name, mod.concat(transform));

    if(d.values) ds.values(read(d.values, d.format));
    else if(d.source) {
      ds.source(d.source);
      model.data(d.source).addListener(ds);
    }

    return ds;    
  };

  return parseData;
});