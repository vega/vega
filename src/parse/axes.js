var dl = require('datalib'),
    axs = require('../scene/axis'),
    themeVal = require('../util/theme-val');

var ORIENT = {
  "x":      "bottom",
  "y":      "left",
  "top":    "top",
  "bottom": "bottom",
  "left":   "left",
  "right":  "right"
};

function parseAxes(model, spec, axes, group) {
  var cfg = config(model);
  (spec || []).forEach(function(def, index) {
    axes[index] = axes[index] || axs(model, cfg[def.type]);
    parseAxis(cfg[def.type], def, index, axes[index], group);
  });
}

function parseAxis(config, def, index, axis, group) {
  // axis scale
  var scale;
  if (def.scale !== undefined) {
    axis.scale(scale = group.scale(def.scale));
  }

  // grid by scaletype
  var grid = config.grid;
  if (dl.isObject(grid)) {
    config.grid = grid[scale.type] !== undefined ? grid[scale.type] : grid.default;
  }

  // axis orientation
  axis.orient(themeVal(def, config, 'orient', ORIENT[def.type]));
  // axis offset
  axis.offset(themeVal(def, config, 'offset', 0));
  // axis layer
  axis.layer(themeVal(def, config, 'layer', 'front'));
  // axis grid lines
  axis.grid(themeVal(def, config, 'grid', false));
  // axis title
  axis.title(def.title || null);
  // axis title offset
  axis.titleOffset(themeVal(def, config, 'titleOffset'));
  // axis values
  axis.tickValues(def.values || null);
  // axis label formatting
  axis.tickFormat(def.format || null);
  axis.tickFormatType(def.formatType || null);
  // axis tick subdivision
  axis.tickSubdivide(def.subdivide || 0);
  // axis tick padding (config.padding for backwards compatibility).
  axis.tickPadding(themeVal(def, config, 'tickPadding', config.padding));

  // axis tick size(s)
  var ts = themeVal(def, config, 'tickSize'),
      size = [ts, ts, ts];

  size[0] = themeVal(def, config, 'tickSizeMajor', size[0]);
  size[1] = themeVal(def, config, 'tickSizeMinor', size[1]);
  size[2] = themeVal(def, config, 'tickSizeEnd', size[2]);

  if (size.length) {
    axis.tickSize.apply(axis, size);
  }

  // axis tick count
  axis.tickCount(themeVal(def, config, 'ticks'));

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

function config(model) {
  var cfg  = model.config(),
      axis = cfg.axis;

  return {
    x: dl.extend(dl.duplicate(axis), cfg.axis_x),
    y: dl.extend(dl.duplicate(axis), cfg.axis_y)
  };
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
