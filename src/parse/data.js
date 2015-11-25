var dl = require('datalib'),
    log = require('vega-logging'),
    parseTransforms = require('./transforms'),
    parseModify = require('./modify');

function parseData(model, spec, callback) {
  var config = model.config(),
      count = 0;

  function onError(error, d) {
    log.error('PARSE DATA FAILED: ' + d.name + ' ' + error);
    count = -1;
    callback(error);
  }

  function onLoad(d) {
    return function(error, data) {
      if (error) {
        onError(error, d);
      } else if (count > 0) {
        try {
          model.data(d.name).values(dl.read(data, d.format));
          if (--count === 0) callback();
        } catch (err) {
          onError(err, d);
        }
      }
    };
  }

  // process each data set definition
  (spec || []).forEach(function(d) {
    if (d.url) {
      count += 1;
      dl.load(dl.extend({url: d.url}, config.load), onLoad(d));
    }
    try {
      parseData.datasource(model, d);
    } catch (err) {
      onError(err, d);
    }
  });

  if (count === 0) setTimeout(callback, 1);
  return spec;
}

parseData.datasource = function(model, d) {
  var transform = (d.transform || []).map(function(t) {
        return parseTransforms(model, t);
      }),
      mod = (d.modify || []).map(function(m) {
        return parseModify(model, m, d);
      }),
      ds = model.data(d.name, mod.concat(transform));

  if (d.values) {
    ds.values(dl.read(d.values, d.format));
  } else if (d.source) {
    // Derived ds will be pulsed by its src rather than the model.
    ds.source(d.source).addListener(ds);
    model.removeListener(ds.pipeline()[0]);
  }

  return ds;
};

module.exports = parseData;

var parseDef = {
  "oneOf": [
    {"enum": ["auto"]},
    {
      "type": "object",
      "additionalProperties": {
        "enum": ["number", "boolean", "date", "string"]
      }
    }
  ]
};

parseData.schema = {
  "defs": {
    "data": {
      "title": "Input data set definition",
      "type": "object",

      "allOf": [{
        "properties": {
          "name": {"type": "string"},
          "transform": {"$ref": "#/defs/transform"},
          "modify": {"$ref": "#/defs/modify"},
          "format": {
            "type": "object",
            "oneOf": [{
              "properties": {
                "type": {"enum": ["json"]},
                "parse": parseDef,
                "property": {"type": "string"}
              },
              "additionalProperties": false
            }, {
              "properties": {
                "type": {"enum": ["csv", "tsv"]},
                "parse": parseDef
              },
              "additionalProperties": false
            }, {
              "oneOf": [{
                "properties": {
                  "type": {"enum": ["topojson"]},
                  "feature": {"type": "string"}
                },
                "additionalProperties": false
              }, {
                "properties": {
                  "type": {"enum": ["topojson"]},
                  "mesh": {"type": "string"}
                },
                "additionalProperties": false
              }]
            }, {
              "properties": {
                "type": {"enum": ["treejson"]},
                "children": {"type": "string"},
                "parse": parseDef
              },
              "additionalProperties": false
            }]
          }
        },
        "required": ["name"]
      }, {
        "anyOf": [{
          "required": ["name", "modify"]
        }, {
          "oneOf": [{
            "properties": {"source": {"type": "string"}},
            "required": ["source"]
          }, {
            "properties": {"values": {"type": "array"}},
            "required": ["values"]
          }, {
            "properties": {"url": {"type": "string"}},
            "required": ["url"]
          }]
        }]
      }]
    }
  }
};
