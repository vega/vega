var dl = require('datalib'),
    parseProperties = require('./properties');

function parseMark(model, mark) {
  var props = mark.properties,
      group = mark.marks,
      config = model._config;

  // set symbol shape based on type of graph
  var symbolShape = model._config.legend.symbolShape;
  if (typeof symbolShape === 'object' && model.markType) {
    if (model.markType in symbolShape) {
      model._config.legend.symbolShape = symbolShape[model.markType];
    } else {
      model._config.legend.symbolShape = symbolShape['default'];
    }
  }

  // set grids based on type of graph
  gridProperty('axis', model, mark);
  gridProperty('axis_x', model, mark);
  gridProperty('axis_y', model, mark);

  // for scatter plots, set symbol size specified in config if not in spec
  var enter = props['enter'];
  if (mark.type === 'symbol') {
    if (!enter['size'] && config && config.marks && config.marks.symbolSize) {
      enter['size'] = {value: model._config.marks.symbolSize};
    }
  }

  // parse mark property definitions
  dl.keys(props).forEach(function(k) {
    defaultColor('fill', 'defaultFill', props[k], config);
    defaultColor('stroke', 'defaultFill', props[k], config);
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

// set grid on or off based on graph type
function gridProperty(axis, model, mark) {
  if (typeof model._config[axis] !== 'undefined') {
    var gridOn = model._config[axis].grid;
    if (typeof gridOn === 'object') {
      if (model.markType in gridOn) {
        model._config[axis].grid = gridOn[model.markType];
      } else {
        model._config[axis].grid = gridOn['default'];
      }
    }
  }
}

// set color given in graph if "default" specified in spec for marks color
function defaultColor(property, configProperty, prop, config) {
  if (property in prop && 'value' in prop[property] && prop[property]['value'] === 'default') {
    if (typeof config !== 'undefined' && 'marks' in config && configProperty in config.marks) {
      prop[property]['value'] = config.marks[configProperty];
    } else {
      prop[property]['value'] = '#000000';
    }
  }
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
      "anyOf": [{"required": ["type"]}, {"required": ["name"]}]
    }
  }
};
