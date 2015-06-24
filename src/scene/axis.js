var d3 = require('d3'),
    util = require('datalib/src/util'),
    tpl = require('vega-dataflow/src/Tuple'),
    config = require('../util/config'),
    parseMark = require('../parse/mark');

function axs(model) {
  var scale,
      orient = config.axis.orient,
      offset = 0,
      titleOffset = config.axis.titleOffset,
      axisDef = {},
      layer = "front",
      grid = false,
      title = null,
      tickMajorSize = config.axis.tickSize,
      tickMinorSize = config.axis.tickSize,
      tickEndSize = config.axis.tickSize,
      tickPadding = config.axis.padding,
      tickValues = null,
      tickFormatString = null,
      tickSubdivide = 0,
      tickCount = config.axis.ticks,
      gridLineStyle = {},
      tickLabelStyle = {},
      majorTickStyle = {},
      minorTickStyle = {},
      titleStyle = {},
      domainStyle = {},
      m = { // Axis marks as references for updates
        gridLines:  {},
        majorTicks: {},
        minorTicks: {},
        tickLabels: {},
        domain: {},
        title:  {}
      };

  var axis = {};

  function reset() {
    axisDef.type = null;
  }

  function ingest(d) {
    return {data: d};
  }

  function getTickFormatString() {
    return tickFormatString || (scale.type === 'log' ? ".1s" : null);
  }
  
  function buildTickFormat() {
    var fmtStr = getTickFormatString();
    if (scale.tickFormat) {
      return scale.tickFormat(tickCount, fmtStr);
    } else if (fmtStr) {
      return ((scale.type === 'time') ?
        d3.time.format(fmtStr) : d3.format(fmtStr));
    } else {
      return String;
    }
  }
  
  function buildTicks(fmt) {
    var ticks = {
      major: tickValues,
      minor: null
    };
    
    if (ticks.major == null) {
      ticks.major = scale.ticks ?
        scale.ticks(tickCount) : scale.domain();
    }
  
    ticks.minor = vg_axisSubdivide(scale, ticks.major, tickSubdivide)
      .map(ingest);
  
    ticks.major = ticks.major.map(function(d) {
      return (d = ingest(d), d.label = fmt(d.data), d);
    });
    
    return ticks;
  }

  axis.def = function() {
    if(!axisDef.type) axis_def(scale);

    var fmt = buildTickFormat();
    var ticks = buildTicks(fmt);
    var tdata = title ? [title].map(ingest) : [];

    axisDef.marks[0].from = function() { return grid ? ticks.major : []; };
    axisDef.marks[1].from = function() { return ticks.major; };
    axisDef.marks[2].from = function() { return ticks.minor; };
    axisDef.marks[3].from = axisDef.marks[1].from;
    axisDef.marks[4].from = function() { return [1]; };
    axisDef.marks[5].from = function() { return tdata; };
    axisDef.offset = offset;
    axisDef.orient = orient;
    axisDef.layer = layer;
    return axisDef;
  };

  function axis_def(scale) {
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
    util.extend(m.gridLines, vg_axisTicks());
    util.extend(m.majorTicks, vg_axisTicks());
    util.extend(m.minorTicks, vg_axisTicks());
    util.extend(m.tickLabels, vg_axisTickLabels());
    util.extend(m.domain, vg_axisDomain());
    util.extend(m.title, vg_axisTitle());
    m.gridLines.properties.enter.stroke = {value: config.axis.gridColor};

    // extend axis marks based on axis orientation
    vg_axisTicksExtend(orient, m.gridLines, oldScale, newScale, Infinity);
    vg_axisTicksExtend(orient, m.majorTicks, oldScale, newScale, tickMajorSize);
    vg_axisTicksExtend(orient, m.minorTicks, oldScale, newScale, tickMinorSize);
    vg_axisLabelExtend(orient, m.tickLabels, oldScale, newScale, tickMajorSize, tickPadding);

    vg_axisDomainExtend(orient, m.domain, range, tickEndSize);
    vg_axisTitleExtend(orient, m.title, range, titleOffset); // TODO get offset
    
    // add / override custom style properties
    util.extend(m.gridLines.properties.update, gridLineStyle);
    util.extend(m.majorTicks.properties.update, majorTickStyle);
    util.extend(m.minorTicks.properties.update, minorTickStyle);
    util.extend(m.tickLabels.properties.update, tickLabelStyle);
    util.extend(m.domain.properties.update, domainStyle);
    util.extend(m.title.properties.update, titleStyle);

    var marks = [m.gridLines, m.majorTicks, m.minorTicks, m.tickLabels, m.domain, m.title];
    util.extend(axisDef, {
      type: "group",
      interactive: false,
      properties: { 
        enter: {
          encode: vg_axisUpdate,
          scales: [scale.scaleName],
          signals: [], data: []
        },
        update: {
          encode: vg_axisUpdate,
          scales: [scale.scaleName],
          signals: [], data: []
        }
      }
    });

    axisDef.marks = marks.map(function(m) { return parseMark(model, m); });
  }

  axis.scale = function(x) {
    if (!arguments.length) return scale;
    if (scale !== x) { scale = x; reset(); }
    return axis;
  };

  axis.orient = function(x) {
    if (!arguments.length) return orient;
    if (orient !== x) {
      orient = x in vg_axisOrients ? x + "" : config.axis.orient;
      reset();
    }
    return axis;
  };

  axis.title = function(x) {
    if (!arguments.length) return title;
    if (title !== x) { title = x; reset(); }
    return axis;
  };

  axis.tickCount = function(x) {
    if (!arguments.length) return tickCount;
    tickCount = x;
    return axis;
  };

  axis.tickValues = function(x) {
    if (!arguments.length) return tickValues;
    tickValues = x;
    return axis;
  };

  axis.tickFormat = function(x) {
    if (!arguments.length) return tickFormatString;
    if (tickFormatString !== x) {
      tickFormatString = x;
      reset();
    }
    return axis;
  };
  
  axis.tickSize = function(x, y) {
    if (!arguments.length) return tickMajorSize;
    var n = arguments.length - 1,
        major = +x,
        minor = n > 1 ? +y : tickMajorSize,
        end   = n > 0 ? +arguments[n] : tickMajorSize;

    if (tickMajorSize !== major ||
        tickMinorSize !== minor ||
        tickEndSize !== end) {
      reset();
    }

    tickMajorSize = major;
    tickMinorSize = minor;
    tickEndSize = end;
    return axis;
  };

  axis.tickSubdivide = function(x) {
    if (!arguments.length) return tickSubdivide;
    tickSubdivide = +x;
    return axis;
  };
  
  axis.offset = function(x) {
    if (!arguments.length) return offset;
    offset = util.isObject(x) ? x : +x;
    return axis;
  };

  axis.tickPadding = function(x) {
    if (!arguments.length) return tickPadding;
    if (tickPadding !== +x) { tickPadding = +x; reset(); }
    return axis;
  };

  axis.titleOffset = function(x) {
    if (!arguments.length) return titleOffset;
    if (titleOffset !== +x) { titleOffset = +x; reset(); }
    return axis;
  };

  axis.layer = function(x) {
    if (!arguments.length) return layer;
    if (layer !== x) { layer = x; reset(); }
    return axis;
  };

  axis.grid = function(x) {
    if (!arguments.length) return grid;
    if (grid !== x) { grid = x; reset(); }
    return axis;
  };

  axis.gridLineProperties = function(x) {
    if (!arguments.length) return gridLineStyle;
    if (gridLineStyle !== x) { gridLineStyle = x; }
    return axis;
  };

  axis.majorTickProperties = function(x) {
    if (!arguments.length) return majorTickStyle;
    if (majorTickStyle !== x) { majorTickStyle = x; }
    return axis;
  };

  axis.minorTickProperties = function(x) {
    if (!arguments.length) return minorTickStyle;
    if (minorTickStyle !== x) { minorTickStyle = x; }
    return axis;
  };

  axis.tickLabelProperties = function(x) {
    if (!arguments.length) return tickLabelStyle;
    if (tickLabelStyle !== x) { tickLabelStyle = x; }
    return axis;
  };

  axis.titleProperties = function(x) {
    if (!arguments.length) return titleStyle;
    if (titleStyle !== x) { titleStyle = x; }
    return axis;
  };

  axis.domainProperties = function(x) {
    if (!arguments.length) return domainStyle;
    if (domainStyle !== x) { domainStyle = x; }
    return axis;
  };
  
  axis.reset = function() { 
    reset(); 
    return axis; 
  };

  return axis;
}

var vg_axisOrients = {top: 1, right: 1, bottom: 1, left: 1};

function vg_axisSubdivide(scale, ticks, m) {
  var subticks = [];
  if (m && ticks.length > 1) {
    var extent = vg_axisScaleExtent(scale.domain()),
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
  return scale.rangeExtent ?
    scale.rangeExtent() :
    vg_axisScaleExtent(scale.range());
}

var vg_axisAlign = {
  bottom: "center",
  top: "center",
  left: "right",
  right: "left"
};

var vg_axisBaseline = {
  bottom: "top",
  top: "bottom",
  left: "middle",
  right: "middle"
};

function vg_axisLabelExtend(orient, labels, oldScale, newScale, size, pad) {
  size = Math.max(size, 0) + pad;
  if (orient === "left" || orient === "top") {
    size *= -1;
  }  
  if (orient === "top" || orient === "bottom") {
    util.extend(labels.properties.enter, {
      x: oldScale,
      y: {value: size},
    });
    util.extend(labels.properties.update, {
      x: newScale,
      y: {value: size},
      align: {value: "center"},
      baseline: {value: vg_axisBaseline[orient]}
    });
  } else {
    util.extend(labels.properties.enter, {
      x: {value: size},
      y: oldScale,
    });
    util.extend(labels.properties.update, {
      x: {value: size},
      y: newScale,
      align: {value: vg_axisAlign[orient]},
      baseline: {value: "middle"}
    });
  }
}

function vg_axisTicksExtend(orient, ticks, oldScale, newScale, size) {
  var sign = (orient === "left" || orient === "top") ? -1 : 1;
  if (size === Infinity) {
    size = (orient === "top" || orient === "bottom") ?
      {field: {group: "height", level: 2}, mult: -sign} :
      {field: {group: "width",  level: 2}, mult: -sign};
  } else {
    size = {value: sign * size};
  }
  if (orient === "top" || orient === "bottom") {
    util.extend(ticks.properties.enter, {
      x:  oldScale,
      y:  {value: 0},
      y2: size
    });
    util.extend(ticks.properties.update, {
      x:  newScale,
      y:  {value: 0},
      y2: size
    });
    util.extend(ticks.properties.exit, {
      x:  newScale,
    });        
  } else {
    util.extend(ticks.properties.enter, {
      x:  {value: 0},
      x2: size,
      y:  oldScale
    });
    util.extend(ticks.properties.update, {
      x:  {value: 0},
      x2: size,
      y:  newScale
    });
    util.extend(ticks.properties.exit, {
      y:  newScale,
    });
  }
}

function vg_axisTitleExtend(orient, title, range, offset) {
  var mid = ~~((range[0] + range[1]) / 2),
      sign = (orient === "top" || orient === "left") ? -1 : 1;
  
  if (orient === "bottom" || orient === "top") {
    util.extend(title.properties.update, {
      x: {value: mid},
      y: {value: sign*offset},
      angle: {value: 0}
    });
  } else {
    util.extend(title.properties.update, {
      x: {value: sign*offset},
      y: {value: mid},
      angle: {value: -90}
    });
  }
}

function vg_axisDomainExtend(orient, domain, range, size) {
  var path;
  if (orient === "top" || orient === "left") {
    size = -1 * size;
  }
  if (orient === "bottom" || orient === "top") {
    path = "M" + range[0] + "," + size + "V0H" + range[1] + "V" + size;
  } else {
    path = "M" + size + "," + range[0] + "H0V" + range[1] + "H" + size;
  }
  domain.properties.update.path = {value: path};
}

function vg_axisUpdate(item, group, trans) {
  var o = trans ? {} : item,
      offset = item.mark.def.offset,
      orient = item.mark.def.orient,
      width  = group.width,
      height = group.height; // TODO fallback to global w,h?

  if (util.isArray(offset)) {
    var ofx = offset[0],
        ofy = offset[1];

    switch (orient) {
      case "left":   { tpl.set(o, 'x', -ofx); tpl.set(o, 'y', ofy); break; }
      case "right":  { tpl.set(o, 'x', width + ofx); tpl.set(o, 'y', ofy); break; }
      case "bottom": { tpl.set(o, 'x', ofx); tpl.set(o, 'y', height + ofy); break; }
      case "top":    { tpl.set(o, 'x', ofx); tpl.set(o, 'y', -ofy); break; }
      default:       { tpl.set(o, 'x', ofx); tpl.set(o, 'y', ofy); }
    }
  } else {
    if (util.isObject(offset)) {
      offset = -group.scale(offset.scale)(offset.value);
    }

    switch (orient) {
      case "left":   { tpl.set(o, 'x', -offset); tpl.set(o, 'y', 0); break; }
      case "right":  { tpl.set(o, 'x', width + offset); tpl.set(o, 'y', 0); break; }
      case "bottom": { tpl.set(o, 'x', 0); tpl.set(o, 'y', height + offset); break; }
      case "top":    { tpl.set(o, 'x', 0); tpl.set(o, 'y', -offset); break; }
      default:       { tpl.set(o, 'x', 0); tpl.set(o, 'y', 0); }
    }
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
        stroke: {value: config.axis.tickColor},
        strokeWidth: {value: config.axis.tickWidth},
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
    interactive: true,
    key: "data",
    properties: {
      enter: {
        fill: {value: config.axis.tickLabelColor},
        font: {value: config.axis.tickLabelFont},
        fontSize: {value: config.axis.tickLabelFontSize},
        opacity: {value: 1e-6},
        text: {field: "label"}
      },
      exit: { opacity: {value: 1e-6} },
      update: { opacity: {value: 1} }
    }
  };
}

function vg_axisTitle() {
  return {
    type: "text",
    interactive: true,
    properties: {
      enter: {
        font: {value: config.axis.titleFont},
        fontSize: {value: config.axis.titleFontSize},
        fontWeight: {value: config.axis.titleFontWeight},
        fill: {value: config.axis.titleColor},
        align: {value: "center"},
        baseline: {value: "middle"},
        text: {field: "data"}
      },
      update: {}
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
        stroke: {value: config.axis.axisColor},
        strokeWidth: {value: config.axis.axisWidth}
      },
      update: {}
    }
  };
}

module.exports = axs;
