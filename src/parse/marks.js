var parseMark = require('./mark'),
    parseProperties = require('./properties');

function parseRootMark(model, spec, width, height) {
  return {
    type:       'group',
    width:      width,
    height:     height,
    properties: defaults(spec.scene || {}, model),
    scales:     spec.scales  || [],
    axes:       spec.axes    || [],
    legends:    spec.legends || [],
    marks:      (spec.marks || []).map(function(m) { return parseMark(model, m, true); })
  };
}

var PROPERTIES = [
  'fill', 'fillOpacity', 'stroke', 'strokeOpacity',
  'strokeWidth', 'strokeDash', 'strokeDashOffset'
];

function defaults(spec, model) {
  var config = model.config().scene,
      props = {}, i, n, m, p, s;

  for (i=0, n=m=PROPERTIES.length; i<n; ++i) {
    p = PROPERTIES[i];
    if ((s=spec[p]) !== undefined) {
      props[p] = s.signal ? s : {value: s};
    } else if (config[p]) {
      props[p] = {value: config[p]};
    } else {
      --m;
    }
  }

  return m ? {update: parseProperties(model, 'group', props)} : {};
}

module.exports = parseRootMark;

parseRootMark.schema = {
  "defs": {
    "container": {
      "type": "object",
      "properties": {
        "scene": {
          "type": "object",
          "properties": {
            "fill": {
              "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
            },
            "fillOpacity": {
              "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
            },
            "stroke": {
              "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
            },
            "strokeOpacity": {
              "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
            },
            "strokeWidth": {
              "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
            },
            "strokeDash": {
              "oneOf": [
                {"type": "array", "items": {"type": "number"}}, 
                {"$ref": "#/refs/signal"}
              ]
            },
            "strokeDashOffset": {
              "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
            },
          }
        },
        "scales": {
          "type": "array",
          "items": {"$ref": "#/defs/scale"}
        },
        "axes": {
          "type": "array",
          "items": {"$ref": "#/defs/axis"}
        },
        "legends": {
          "type": "array",
          "items": {"$ref": "#/defs/legend"}
        },
        "marks": {
          "type": "array",
          "items": {"oneOf":[{"$ref": "#/defs/groupMark"}, {"$ref": "#/defs/visualMark"}]}
        }
      }
    },


    "groupMark": {
      "allOf": [
        {
          "properties": { "type": {"enum": ["group"]} },
          "required": ["type"]
        },
        {"$ref": "#/defs/mark"},
        {"$ref": "#/defs/container"}
      ]
    },

    "visualMark": {
      "allOf": [
        {
          "not": { "properties": { "type": {"enum": ["group"]} } },
        },
        {"$ref": "#/defs/mark"}
      ]
    }
  }
};
