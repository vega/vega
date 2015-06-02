var dl = require('datalib'),
    config = require('../util/config'),
    log = require('../util/log'),
    parseTransforms = require('./transforms'),
    parseModify = require('./modify');

function parseData(model, spec, callback) {
  var count = 0;

  function loaded(d) {
    return function(error, data) {
      if (error) {
        log.error("LOADING FAILED: " + d.url + " " + error);
      } else {
        model.data(d.name).values(dl.read(data, d.format));
      }
      if (--count === 0) callback();
    }
  }

  // process each data set definition
  (spec || []).forEach(function(d) {
    if (d.url) {
      count += 1;
      dl.load(dl.extend({url: d.url}, config.load), loaded(d));
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

  if (d.values) {
    ds.values(dl.read(d.values, d.format));
  } else if (d.source) {
    ds.source(d.source)
      .revises(ds.revises()) // If new ds revises, then it's origin must revise too.
      .addListener(ds);  // Derived ds will be pulsed by its src rather than the model.
    model.removeListener(ds.pipeline()[0]); 
  }

  return ds;    
};

module.exports   = parseData;
parseData.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Input data sets",
  "type": "object",
  "properties": {
    "name": {"type": "string"},
    "source": {"type": "string"},
    "values": {
      "type": "array",
      "items": {"type": "any"}
    },
    "url": {"type": "string"},
    "transform": {"$ref": "#/refs/transform"},
    "format": {
      "type": "object",
      "properties": {
        "oneOf": [
          {
            "type": {"enum": ["json"]},
            "parse": {
              "type": "object",
              "additionalProperties": {
                "enum": ["number", "boolean", "date", "string"]
              }
            },
            "property": {"type": "string"},
          },
          {
            "type": {"enum": ["csv", "tsv"]},
            "parse": {
              "type": "object",
              "additionalProperties": {
                "enum": ["number", "boolean", "date", "string"]
              }
            }
          },
          {
            "type": {"enum": ["topojson"]},
            "feature": {"type": "string"},
            "mesh": {"type": "string"}
          },
          {
            "type": {"enum": ["treejson"]},
            "children": {"type": "string"},
            "parse": {
              "type": "object",
              "additionalProperties": {
                "enum": ["number", "boolean", "date", "string"]
              }
            }
          }
        ]
      }
    }
  },
  "oneOf": [
    {"required": ["name", "source"]},
    {"required": ["name", "values"]},
    {"required": ["name", "url"]}
  ]
}
