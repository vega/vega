vg.scene.axis = function() {
  var scale,
      orient = vg_axisDefaultOrient,
      offset = 0,
      axisModel = null,
      tickMajorSize = vg.config.axis.tickSize,
      tickMinorSize = vg.config.axis.tickSize,
      tickEndSize = vg.config.axis.tickSize,
      tickPadding = vg.config.axis.padding,
      tickValues = null,
      tickFormat = null,
      tickSubdivide = 0,
      tickArguments = [vg.config.axis.ticks],
      tickLabelStyle = {},
      majorTickStyle = {},
      minorTickStyle = {},
      domainStyle = {};

  var axis = {};

  axis.model = function() {
    // TODO: only generate model as-needed; use dirty bit?
    var model = axisModel = axis_model(scale);
    
    // generate data
    var major = tickValues == null
      ? (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain())
      : tickValues;
    var minor = vg_axisSubdivide(scale, major, tickSubdivide).map(vg.data.ingest);
    major = major.map(vg.data.ingest);
    var fmt = tickFormat==null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : String) : tickFormat;
    major.forEach(function(d) { d.label = fmt(d.data); });
    
    // update axis model
    model.marks[0].from = function() { return major; };
    model.marks[1].from = function() { return minor; };
    model.marks[2].from = model.marks[0].from;
    model.marks[3].from = function() { return [1]; };
    model.offset = offset;
    model.orient = orient;
    return model;
  };

  function axis_model(scale) {
    // setup scale mapping
    var newScale, oldScale, range;
    if (scale.type === "ordinal") {
      newScale = {scale: scale.scaleName, offset: 0.5 + scale.rangeBand()/2};
      oldScale = newScale;
    } else {
      newScale = {scale: scale.scaleName, offset: 0.5};
      oldScale = {scale: scale.scaleName+":prev", offset: 0.5};
    }
    range = vg_axisScaleRange(scale);

    // setup axis marks
    var majorTicks = vg_axisTicks();
    var minorTicks = vg_axisTicks();
    var tickLabels = vg_axisTickLabels();
    var domain = vg_axisDomain();
    var marks = [majorTicks, minorTicks, tickLabels, domain];

    switch (orient) {
      case "bottom": {
        // tick labels
        vg.extend(tickLabels.properties.enter, {
          x: oldScale,
          y: {value: Math.max(tickMajorSize, 0) + tickPadding},
        });
        vg.extend(tickLabels.properties.update, {
          x: newScale,
          y: {value: Math.max(tickMajorSize, 0) + tickPadding},
          align: {value: "center"},
          baseline: {value: "top"}
        });
        
        // major ticks
        vg.extend(majorTicks.properties.enter, {
          x:  oldScale,
          y:  {value: 0},
          y2: {value: tickMajorSize}
        });
        vg.extend(majorTicks.properties.update, {
          x:  newScale,
          y:  {value: 0},
          y2: {value: tickMajorSize}
        });
        vg.extend(majorTicks.properties.exit, {
          x:  newScale,
        });

        // minor ticks
        vg.extend(minorTicks.properties.enter, {
          x:  oldScale,
          y:  {value: 0},
          y2: {value: tickMinorSize}
        });
        vg.extend(minorTicks.properties.update, {
          x:  newScale,
          y:  {value: 0},
          y2: {value: tickMinorSize}
        });
        vg.extend(minorTicks.properties.exit, {
          x:  newScale,
        });
        
        // domain line
        domain.properties.update.path =
          {value: "M" + range[0] + "," + tickEndSize + "V0H" + range[1] + "V" + tickEndSize};
        
        break;
      }
      
      case "top": {
        // tick labels
        vg.extend(tickLabels.properties.enter, {
          x: oldScale,
          y: {value: -(Math.max(tickMajorSize, 0) + tickPadding)}
        });
        vg.extend(tickLabels.properties.update, {
          x: newScale,
          y: {value: -(Math.max(tickMajorSize, 0) + tickPadding)},
          align: {value: "center"},
          baseline: {value: "bottom"}
        });

        // major ticks
        vg.extend(majorTicks.properties.enter, {
          x:  oldScale,
          y:  {value: 0},
          y2: {value: -tickMajorSize}
        });
        vg.extend(majorTicks.properties.update, {
          x:  newScale,
          y:  {value: 0},
          y2: {value: -tickMajorSize}
        });

        // minor ticks
        vg.extend(minorTicks.properties.enter, {
          x:  oldScale,
          y:  {value: 0},
          y2: {value: -tickMinorSize}
        });
        vg.extend(minorTicks.properties.update, {
          x:  newScale,
          y:  {value: 0},
          y2: {value: -tickMinorSize}
        });
        vg.extend(minorTicks.properties.exit, {
          x:  newScale,
        });

        // domain line
        domain.properties.update.path =
          {value: "M" + range[0] + "," + -tickEndSize + "V0H" + range[1] + "V" + -tickEndSize};
        
        break;
      }
      
      case "left": {
        // tick labels
        vg.extend(tickLabels.properties.enter, {
          x: {value: -(Math.max(tickMajorSize, 0) + tickPadding)},
          y: oldScale,
        });
        vg.extend(tickLabels.properties.update, {
          x: {value: -(Math.max(tickMajorSize, 0) + tickPadding)},
          y: newScale,
          align: {value: "right"},
          baseline: {value: "middle"}
        });

        // major ticks
        vg.extend(majorTicks.properties.enter, {
          x:  {value: 0},
          x2: {value: -tickMajorSize},
          y:  oldScale
        });
        vg.extend(majorTicks.properties.update, {
          x:  {value: 0},
          x2: {value: -tickMajorSize},
          y:  newScale
        });
        vg.extend(majorTicks.properties.exit, {
          y:  newScale,
        });

        // minor ticks
        vg.extend(minorTicks.properties.enter, {
          x:  {value: 0},
          x2: {value: -tickMinorSize},
          y:  oldScale
        });
        vg.extend(minorTicks.properties.update, {
          x:  {value: 0},
          x2: {value: -tickMinorSize},
          y:  newScale
        });
        vg.extend(minorTicks.properties.exit, {
          y:  newScale,
        });

        // domain line
        domain.properties.update.path =
          {value: "M" + -tickEndSize + "," + range[0] + "H0V" + range[1] + "H" + -tickEndSize};

        break;
      }
      
      case "right": {
        // tick labels
        vg.extend(tickLabels.properties.enter, {
          x: {value: Math.max(tickMajorSize, 0) + tickPadding},
          y: oldScale,
        });
        vg.extend(tickLabels.properties.update, {
          x: {value: Math.max(tickMajorSize, 0) + tickPadding},
          y: newScale,
          align: {value: "left"},
          baseline: {value: "middle"}
        });

        // major ticks
        vg.extend(majorTicks.properties.enter, {
          x:  {value: 0},
          x2: {value: tickMajorSize},
          y:  oldScale
        });
        vg.extend(majorTicks.properties.update, {
          x:  {value: 0},
          x2: {value: tickMajorSize},
          y:  newScale
        });
        vg.extend(majorTicks.properties.exit, {
          y:  newScale,
        });

        // minor ticks
        vg.extend(minorTicks.properties.enter, {
          x:  {value: 0},
          x2: {value: tickMinorSize},
          y:  oldScale
        });
        vg.extend(minorTicks.properties.update, {
          x:  {value: 0},
          x2: {value: tickMinorSize},
          y:  newScale
        });
        vg.extend(minorTicks.properties.exit, {
          y:  newScale,
        });

        // domain line
        domain.properties.update.path =
          {value: "M" + tickEndSize + "," + range[0] + "H0V" + range[1] + "H" + tickEndSize};

        break;
      }
    }
    
    // add / override custom style properties
    vg.extend(majorTicks.properties.update, majorTickStyle);
    vg.extend(minorTicks.properties.update, minorTickStyle);
    vg.extend(tickLabels.properties.update, tickLabelStyle);
    vg.extend(domain.properties.update, domainStyle);

    return {
      type: "group",
      interactive: false,
      properties: { update: vg_axisUpdate },
      marks: marks.map(vg.parse.mark)
    };
  }

  axis.scale = function(x) {
    if (!arguments.length) return scale;
    scale = x;
    return axis;
  };

  axis.orient = function(x) {
    if (!arguments.length) return orient;
    orient = x in vg_axisOrients ? x + "" : vg_axisDefaultOrient;
    return axis;
  };

  axis.ticks = function() {
    if (!arguments.length) return tickArguments;
    tickArguments = arguments;
    return axis;
  };

  axis.tickValues = function(x) {
    if (!arguments.length) return tickValues;
    tickValues = x;
    return axis;
  };

  axis.tickFormat = function(x) {
    if (!arguments.length) return tickFormat;
    tickFormat = x;
    return axis;
  };
  
  axis.tickSize = function(x, y) {
    if (!arguments.length) return tickMajorSize;
    var n = arguments.length - 1;
    tickMajorSize = +x;
    tickMinorSize = n > 1 ? +y : tickMajorSize;
    tickEndSize = n > 0 ? +arguments[n] : tickMajorSize;
    return axis;
  };

  axis.tickPadding = function(x) {
    if (!arguments.length) return tickPadding;
    tickPadding = +x;
    return axis;
  };

  axis.tickSubdivide = function(x) {
    if (!arguments.length) return tickSubdivide;
    tickSubdivide = +x;
    return axis;
  };
  
  axis.offset = function(x) {
    if (!arguments.length) return tickValues;
    offset = x;
    return axis;
  };
  
  axis.majorTickProperties = function(x) {
    if (!arguments.length) return majorTickStyle;
    majorTickStyle = x;
    return axis;
  };

  axis.minorTickProperties = function(x) {
    if (!arguments.length) return minorTickStyle;
    minorTickStyle = x;
    return axis;
  };

  axis.tickLabelProperties = function(x) {
    if (!arguments.length) return tickLabelStyle;
    tickLabelStyle = x;
    return axis;
  };

  axis.domainProperties = function(x) {
    if (!arguments.length) return domainStyle;
    domainStyle = x;
    return axis;
  };

  return axis;
};

var vg_axisDefaultOrient = "bottom",
    vg_axisOrients = {top: 1, right: 1, bottom: 1, left: 1};

function vg_axisSubdivide(scale, ticks, m) {
  subticks = [];
  if (m && ticks.length > 1) {
    var extent = vg_axisScaleExtent(scale.domain()),
        subticks,
        i = -1,
        n = ticks.length,
        d = (ticks[1] - ticks[0]) / ++m,
        j,
        v;
    while (++i < n) {
      for (j = m; --j > 0;) {
        if ((v = +ticks[i] - j * d) >= extent[0]) {
          subticks.push(v);
        }
      }
    }
    for (--i, j = 0; ++j < m && (v = +ticks[i] + j * d) < extent[1];) {
      subticks.push(v);
    }
  }
  return subticks;
}

function vg_axisScaleExtent(domain) {
  var start = domain[0], stop = domain[domain.length - 1];
  return start < stop ? [start, stop] : [stop, start];
}

function vg_axisScaleRange(scale) {
  return scale.rangeExtent
    ? scale.rangeExtent()
    : vg_axisScaleExtent(scale.range());
}

function vg_axisUpdate(item, group, trans) {
  var o = trans ? {} : item,
      offset = item.mark.def.offset,
      orient = item.mark.def.orient,
      width  = group.width,
      height = group.height; // TODO fallback to global w,h?

  switch(orient) {
    case "left":   { o.x = -offset; o.y = 0; break; }
    case "right":  { o.x = width + offset; o.y = 0; break; }
    case "bottom": { o.x = 0; o.y = height + offset; break; }
    case "top":    { o.x = 0; o.y = -offset; break; }
    default:       { o.x = 0; o.y = 0; }
  }
  if (trans) trans.interpolate(item, o);
}

function vg_axisTicks() {
  return {
    type: "rule",
    interactive: false,
    key: "data",
    properties: {
      enter: {
        stroke: {value: vg.config.axis.tickColor},
        strokeWidth: {value: vg.config.axis.tickWidth},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: { opacity: {value: 1} }
    }
  };
}

function vg_axisTickLabels() {
  return {
    type: "text",
    interactive: false,
    key: "data",
    properties: {
      enter: {
        fill: {value: vg.config.axis.tickLabelColor},
        font: {value: vg.config.axis.tickLabelFont},
        fontSize: {value: vg.config.axis.tickLabelFontSize},
        opacity: {value: 1e-6},
        text: {field: "label"}
      },
      exit: { opacity: {value: 1e-6} },
      update: { opacity: {value: 1} }
    }
  };
}

function vg_axisDomain() {
  return {
    type: "path",
    interactive: false,
    properties: {
      enter: {
        x: {value: 0.5},
        y: {value: 0.5},
        stroke: {value: vg.config.axis.axisColor},
        strokeWidth: {value: vg.config.axis.axisWidth}
      },
      update: {}
    }
  };
}