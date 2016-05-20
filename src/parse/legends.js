var lgnd = require('../scene/legend');

function parseLegends(model, spec, legends, group) {
  (spec || []).forEach(function(def, index) {
    legends[index] = legends[index] || lgnd(model);
    parseLegend(def, index, legends[index], group);
  });
}

function parseLegend(def, index, legend, group) {
  // legend scales
  legend.size   (def.size    ? group.scale(def.size)    : null);
  legend.shape  (def.shape   ? group.scale(def.shape)   : null);
  legend.fill   (def.fill    ? group.scale(def.fill)    : null);
  legend.stroke (def.stroke  ? group.scale(def.stroke)  : null);
  legend.opacity(def.opacity ? group.scale(def.opacity) : null);

  // legend orientation
  if (def.orient) legend.orient(def.orient);

  // legend offset
  if (def.offset != null) legend.offset(def.offset);

  // legend title
  legend.title(def.title || null);

  // legend values
  legend.values(def.values || null);

  // legend label formatting
  legend.format(def.format !== undefined ? def.format : null);
  legend.formatType(def.formatType || null);

  // style properties
  var p = def.properties;
  legend.titleProperties(p && p.title || {});
  legend.labelProperties(p && p.labels || {});
  legend.legendProperties(p && p.legend || {});
  legend.symbolProperties(p && p.symbols || {});
  legend.gradientProperties(p && p.gradient || {});
}

module.exports = parseLegends;

parseLegends.schema = {
  "defs": {
    "legend": {
      "type": "object",
      "properties": {
        "size": {"type": "string"},
        "shape": {"type": "string"},
        "fill": {"type": "string"},
        "stroke": {"type": "string"},
        "opacity": {"type": "string"},
        "orient": {"enum": ["left", "right"], "default": "right"},
        "offset": {"type": "number"},
        "title": {"type": "string"},
        "values": {"type": "array"},
        "format": {"type": "string"},
        "formatType": {"enum": ["time", "utc", "string", "number"]},
        "properties": {
          "type": "object",
          "properties": {
            "title": {"$ref": "#/defs/propset"},
            "labels": {"$ref": "#/defs/propset"},
            "legend": {"$ref": "#/defs/propset"},
            "symbols": {"$ref": "#/defs/propset"},
            "gradient": {"$ref": "#/defs/propset"}
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false,
      "anyOf": [
        {"required": ["size"]},
        {"required": ["shape"]},
        {"required": ["fill"]},
        {"required": ["stroke"]},
        {"required": ["opacity"]}
      ]
    }
  }
};
