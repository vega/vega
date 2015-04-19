var dl = require('datalib'),
    axs = require('../scene/axis'),
    config = require('../util/config');

var ORIENT = {
  "x":      "bottom",
  "y":      "left",
  "top":    "top",
  "bottom": "bottom",
  "left":   "left",
  "right":  "right"
};

function axes(model, spec, axes, group) {
  (spec || []).forEach(function(def, index) {
    axes[index] = axes[index] || axs(model);
    axis(def, index, axes[index], group);
  });
};

function axis(def, index, axis, group) {
  // axis scale
  if (def.scale !== undefined) {
    axis.scale(group.scale(def.scale));
  }

  // axis orientation
  axis.orient(def.orient || ORIENT[def.type]);
  // axis offset
  axis.offset(def.offset || 0);
  // axis layer
  axis.layer(def.layer || "front");
  // axis grid lines
  axis.grid(def.grid || false);
  // axis title
  axis.title(def.title || null);
  // axis title offset
  axis.titleOffset(def.titleOffset != null
    ? def.titleOffset : config.axis.titleOffset);
  // axis values
  axis.tickValues(def.values || null);
  // axis label formatting
  axis.tickFormat(def.format || null);
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
  if (def.tickSizeEnd   != null) size[2] = def.tickSizeEnd;
  if (size.length) {
    axis.tickSize.apply(axis, size);
  }

  // tick arguments
  if (def.ticks != null) {
    var ticks = dl.isArray(def.ticks) ? def.ticks : [def.ticks];
    axis.ticks.apply(axis, ticks);
  } else {
    axis.ticks(config.axis.ticks);
  }

  // style properties
  var p = def.properties;
  if (p && p.ticks) {
    axis.majorTickProperties(p.majorTicks
      ? dl.extend({}, p.ticks, p.majorTicks) : p.ticks);
    axis.minorTickProperties(p.minorTicks
      ? dl.extend({}, p.ticks, p.minorTicks) : p.ticks);
  } else {
    axis.majorTickProperties(p && p.majorTicks || {});
    axis.minorTickProperties(p && p.minorTicks || {});
  }
  axis.tickLabelProperties(p && p.labels || {});
  axis.titleProperties(p && p.title || {});
  axis.gridLineProperties(p && p.grid || {});
  axis.domainProperties(p && p.axis || {});
}

module.exports = axes;