var dl = require('datalib'),
    parseProperties = require('./properties');

function parseMark(model, mark, isMark=false) {
  var props = mark.properties,
      group = mark.marks,
      config = model._config;

  // for scatter plots, set symbol size specified in config if not in spec
  if (typeof props !== 'undefined') {
    var enter = props['enter'];
    if (mark.type === 'symbol') {
      if (enter && !enter['size'] && config && config.marks && config.marks.symbolSize) {
        enter['size'] = {value: model._config.marks.symbolSize};
      }
    }
  }

  // Object defines whether to set the stroke or 
  // fill to the given default color
  var colorMap = {
    symbol: 'fill',
    arc: 'fill',
    area: 'fill',
    rect: 'fill',
    path: 'stroke',
    line: 'stroke',
    rule: 'stroke',
    text: 'stroke'
  }

  // Set default mark color if no color is given in spec
  if (isMark) {
    var property = colorMap[mark.type];
    if (typeof props !== 'undefined' && 'enter' in props && !(property in props['enter'])) {
      setDefaultColor(property, props, config);
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
    mark.marks = group.map(function(g) { return parseMark(model, g); });
  }

  return mark;
}

function setDefaultColor(property, props, config) {
  var color = '#000000';
  if (typeof config !== 'undefined' && 'marks' in config && 'color' in config.marks) {
    color =  config.marks['color'];
  }
  props['enter'][property] = {
    'value': color
  };
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
