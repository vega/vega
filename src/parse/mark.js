var dl = require('datalib'),
    parseProperties = require('./properties');

function parseMark(model, mark, applyDefaults) {
  var props = mark.properties || (applyDefaults && (mark.properties = {})),
      enter = props.enter || (applyDefaults && (props.enter = {})),
      group = mark.marks,
      config = model.config().marks || {};

  if (applyDefaults) {
    // for scatter plots, set symbol size specified in config if not in spec
    if (mark.type === 'symbol' && !enter.size && config.symbolSize) {
        enter.size = {value: config.symbolSize};
    }

    // Themes define a default "color" that maps to fill/stroke based on mark type.
    var colorMap = {
      arc: 'fill', area: 'fill', rect: 'fill', symbol: 'fill', text: 'fill',
      line: 'stroke', path: 'stroke', rule: 'stroke'
    };

    // Set default mark color if no color is given in spec, and only do so for
    // user-defined marks (not axis/legend marks).
    var colorProp = colorMap[mark.type];
    if (!enter[colorProp] && config.color) {
      enter[colorProp] = {value: config.color};
    }
  }

  // parse mark property definitions
  dl.keys(props).forEach(function(k) {
    props[k] = parseProperties(model, mark.type, props[k]);
  });

  // parse delay function
  if (mark.delay) {
    mark.delay = parseProperties(model, mark.type, {delay: mark.delay});
  }

  // recurse if group type
  if (group) {
    mark.marks = group.map(function(g) { return parseMark(model, g, true); });
  }

  return mark;
}

module.exports = parseMark;

parseMark.schema = {
  "defs": {
    "mark": {
      "type": "object",

      "properties": {
        "name": {"type": "string"},
        "key": {"type": "string"},
        "type": {"enum": ["rect", "symbol", "path", "arc",
          "area", "line", "rule", "image", "text", "group"]},

        "from": {
          "type": "object",
          "properties": {
            "data": {"type": "string"},
            "mark": {"type": "string"},
            "transform": {"$ref": "#/defs/transform"}
          },
          "additionalProperties": false
        },

        "delay": {"$ref": "#/refs/numberValue"},
        "ease": {
          "enum": ["linear", "quad", "cubic", "sin",
            "exp", "circle", "bounce"].reduce(function(acc, e) {
              ["in", "out", "in-out", "out-in"].forEach(function(m) {
                acc.push(e+"-"+m);
              });
              return acc;
          }, [])
        },

        "interactive": {"type": "boolean"},

        "properties": {
          "type": "object",
          "properties": {
            "enter":  {"$ref": "#/defs/propset"},
            "update": {"$ref": "#/defs/propset"},
            "exit":   {"$ref": "#/defs/propset"},
            "hover":  {"$ref": "#/defs/propset"}
          },
          "additionalProperties": false,
          "anyOf": [{"required": ["enter"]}, {"required": ["update"]}]
        }
      },

      // "additionalProperties": false,
      "required": ["type"]
    }
  }
};
