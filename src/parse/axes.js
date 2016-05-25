var dl = require('datalib'),
    axs = require('../scene/axis');

var ORIENT = {
  "x":      "bottom",
  "y":      "left",
  "top":    "top",
  "bottom": "bottom",
  "left":   "left",
  "right":  "right"
};

function parseAxes(model, spec, axes, group) {
  var config = model.config();
  (spec || []).forEach(function(def, index) {
    var updatedConfig = setConfig(config, def.type);
    axes[index] = axes[index] || axs(model, updatedConfig);
    parseAxis(updatedConfig, def, index, axes[index], group);
  });
}

function setConfig(config, defType) {
  var updatedConfig = {};
  updatedConfig.axis = {};
  var axisName = 'axis_' + defType;

  if (typeof config !== 'undefined') {
    if (config[axisName]) {
      for (var key in config[axisName]) {
        if (config[axisName].hasOwnProperty(key)) {
          updatedConfig.axis[key] = config[axisName][key];
        }
      }
    }

    for (var key in config.axis) {
      if (config.axis.hasOwnProperty(key) && (!(key in updatedConfig.axis))) {
        updatedConfig.axis[key] = config.axis[key];
      }
    }
  }
  return updatedConfig;
}

function parseAxis(config, def, index, axis, group) {
  // axis scale
  if (def.scale !== undefined) {
    axis.scale(group.scale(def.scale));
  }

  var scaleType = group.scale(def.scale).type;
  var grid = config.axis.grid;
  if (typeof grid === 'object') {
    if (scaleType in grid) {
      config.axis.grid = grid[scaleType];
    } else {
      config.axis.grid = grid['default'];
    }
  }

  // axis orientation
  axis.orient(def.orient || ORIENT[def.type]);
  // axis offset
  axis.offset(def.offset || 0);
  // axis layer
  axis.layer(def.layer || config.axis.layer || "front");
  // axis grid lines
  axis.grid(def.grid || config.axis.grid || false);
  // axis title
  axis.title(def.title || null);
  // axis title offset
  axis.titleOffset(def.titleOffset != null ?
    def.titleOffset : config.axis.titleOffset);
  // axis values
  axis.tickValues(def.values || null);
  // axis label formatting
  axis.tickFormat(def.format || null);
  axis.tickFormatType(def.formatType || null);
  // axis tick subdivision
  axis.tickSubdivide(def.subdivide || 0);
  // axis tick padding
  axis.tickPadding(def.tickPadding || config.axis.padding);

  // axis tick size(s)
  var size = [];
  if (def.tickSize !== undefined) {
    for (var i=0; i<3; ++i) size.push(def.tickSize);
  } else {
    var ts = config.axis.tickSize;
    size = [ts, ts, ts];
  }
  if (def.tickSizeMajor != null) size[0] = def.tickSizeMajor;
  if (def.tickSizeMinor != null) size[1] = def.tickSizeMinor;
  if ('tickSizeEnd' in config.axis) {
    size[2] = config.axis.tickSizeEnd;
  } else if (def.tickSizeEnd   != null) {
    size[2] = def.tickSizeEnd;
  }
  if (size.length) {
    axis.tickSize.apply(axis, size);
  }

  // axis tick count
  axis.tickCount(def.ticks || config.axis.ticks);

  // style properties
  var p = def.properties;
  if (p && p.ticks) {
    axis.majorTickProperties(p.majorTicks ?
      dl.extend({}, p.ticks, p.majorTicks) : p.ticks);
    axis.minorTickProperties(p.minorTicks ?
      dl.extend({}, p.ticks, p.minorTicks) : p.ticks);
  } else {
    axis.majorTickProperties(p && p.majorTicks || {});
    axis.minorTickProperties(p && p.minorTicks || {});
  }
  axis.tickLabelProperties(p && p.labels || {});
  axis.titleProperties(p && p.title || {});
  axis.gridLineProperties(p && p.grid || {});
  axis.domainProperties(p && p.axis || {});
}

module.exports = parseAxes;

parseAxes.schema = {
  "defs": {
    "axis": {
      "type": "object",
      "properties": {
        "type": {"enum": ["x", "y"]},
        "scale": {"type": "string"},
        "orient": {"enum": ["top", "bottom", "left", "right"]},
        "title": {"type": "string"},
        "titleOffset": {"type": "number"},
        "format": {"type": "string"},
        "formatType": {"enum": ["time", "utc", "string", "number"]},
        "ticks": {"type": "number"},
        "values": {
          "type": "array",
          "items": {"type": ["string", "number"]}
        },
        "subdivide": {"type": "number"},
        "tickPadding": {"type": "number"},
        "tickSize": {"type": "number"},
        "tickSizeMajor": {"type": "number"},
        "tickSizeMinor": {"type": "number"},
        "tickSizeEnd": {"type": "number"},
        "offset": {
          "oneOf": [{"type": "number"}, {
            "type": "object",
            "properties": {
              "scale": {"type": "string"},
              "value": {"type": ["string", "number"]}
            },
            "required": ["scale", "value"],
            "additionalProperties": false
          }]
        },
        "layer": {"enum": ["front", "back"], "default": "front"},
        "grid": {"type": "boolean"},
        "properties": {
          "type": "object",
          "properties": {
            "ticks": {"$ref": "#/defs/propset"},
            "majorTicks": {"$ref": "#/defs/propset"},
            "minorTicks": {"$ref": "#/defs/propset"},
            "labels": {"$ref": "#/defs/propset"},
            "title": {"$ref": "#/defs/propset"},
            "grid": {"$ref": "#/defs/propset"},
            "axis": {"$ref": "#/defs/propset"}
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false,
      "required": ["type", "scale"]
    }
  }
};
