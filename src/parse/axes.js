vg.parse.axes = (function() {
  var ORIENT = {
    "x":      "bottom",
    "y":      "left",
    "top":    "top",
    "bottom": "bottom",
    "left":   "left",
    "right":  "right"
  };

  function axes(spec, axes, scales) {
    (spec || []).forEach(function(def, index) {
      axes[index] = axes[index] || d3.svg.axis();
      axis(def, index, axes[index], scales);
    });
  };

  function axis(def, index, axis, scales) {
    // axis scale
    if (def.scale !== undefined) {
      axis.scale(scales[def.scale]);
      axis.scaleName = def.scale;  // cache scale name
    }

    // axis orientation
    var orient = def.orient || ORIENT[def.type];
    axis.orient(orient);

    // axis values
    if (def.values !== undefined) {
      axis.tickValues(def.values);
    }

    // axis label formatting
    if (def.format !== undefined) {
      axis.tickFormat(d3.format(def.format));
    }

    // axis tick subdivision
    if (def.subdivide !== undefined) {
      axis.tickSubdivide(def.subdivide);
    }

    // axis tick padding
    if (def.tickPadding !== undefined) {
      axis.tickPadding(def.tickPadding);
    }

    // axis tick size(s)
    var size = [];
    if (def.tickSize !== undefined) {
      for (var i=0; i<3; ++i) size.push(def.tickSize);
    } else {
      size = [6, 6, 6];
    }
    if (def.tickSizeMajor !== undefined) size[0] = def.tickSizeMajor;
    if (def.tickSizeMinor !== undefined) size[1] = def.tickSizeMinor;
    if (def.tickSizeEnd   !== undefined) size[2] = def.tickSizeEnd;
    if (size.length) {
      axis.tickSize.apply(axis, size);
    }

    // tick arguments
    if (def.ticks !== undefined) {
      var ticks = Array.isArray(def.ticks) ? def.ticks : [def.ticks];
      axis.ticks.apply(axis, ticks);
    }

    // axis offset
    if (def.offset) {
      axis.offset = def.offset;
    }
  }
  
  return axes;
})();