var d3 = require('d3'),
    dl = require('datalib'),
    Gradient = require('vega-scenegraph').Gradient,
    parseProperties = require('../parse/properties'),
    parseMark = require('../parse/mark'),
    util = require('../util');

function lgnd(model) {
  var size  = null,
      shape = null,
      fill  = null,
      stroke  = null,
      opacity = null,
      spacing = null,
      values  = null,
      formatString = null,
      formatType   = null,
      title  = null,
      config = model.config().legend,
      orient = config.orient,
      offset = config.offset,
      padding = config.padding,
      tickArguments = [5],
      legendStyle = {},
      symbolStyle = {},
      gradientStyle = {},
      titleStyle = {},
      labelStyle = {},
      m = { // Legend marks as references for updates
        titles:  {},
        symbols: {},
        labels:  {},
        gradient: {}
      };

  var legend = {},
      legendDef = {};

  function reset() { legendDef.type = null; }
  function ingest(d, i) { return {data: d, index: i}; }

  legend.def = function() {
    var scale = size || shape || fill || stroke || opacity;

    if (!legendDef.type) {
      legendDef = (scale===fill || scale===stroke) && !discrete(scale.type) ?
        quantDef(scale) : ordinalDef(scale);
    }
    legendDef.orient = orient;
    legendDef.offset = offset;
    legendDef.padding = padding;
    legendDef.margin = config.margin;
    return legendDef;
  };

  function discrete(type) {
    return type==='ordinal' || type==='quantize' ||
           type==='quantile' || type==='threshold';
  }

  function ordinalDef(scale) {
    var def = o_legend_def(size, shape, fill, stroke, opacity);

    // generate data
    var data = (values == null ?
      (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain()) :
      values).map(ingest);

    var fmt = util.getTickFormat(scale, data.length, formatType, formatString);

    // determine spacing between legend entries
    var fs, range, offset, pad=5, domain = d3.range(data.length);
    if (size) {
      range = data.map(function(x) { return Math.sqrt(size(x.data)); });
      offset = d3.max(range);
      range = range.reduce(function(a,b,i,z) {
          if (i > 0) a[i] = a[i-1] + z[i-1]/2 + pad;
          return (a[i] += b/2, a); }, [0]).map(Math.round);
    } else {
      offset = Math.round(Math.sqrt(config.symbolSize));
      range = spacing ||
        (fs = labelStyle.fontSize) && (fs.value + pad) ||
        (config.labelFontSize + pad);
      range = domain.map(function(d,i) {
        return Math.round(offset/2 + i*range);
      });
    }

    // account for padding and title size
    var sz = padding, ts;
    if (title) {
      ts = titleStyle.fontSize;
      sz += 5 + ((ts && ts.value) || config.titleFontSize);
    }
    for (var i=0, n=range.length; i<n; ++i) range[i] += sz;

    // build scale for label layout
    def.scales = def.scales || [{}];
    dl.extend(def.scales[0], {
      name: 'legend',
      type: 'ordinal',
      points: true,
      domain: domain,
      range: range
    });

    // update legend def
    var tdata = (title ? [title] : []).map(ingest);
    data.forEach(function(d) {
      d.label = fmt(d.data);
      d.offset = offset;
    });
    def.marks[0].from = function() { return tdata; };
    def.marks[1].from = function() { return data; };
    def.marks[2].from = def.marks[1].from;

    return def;
  }

  function o_legend_def(size, shape, fill, stroke, opacity) {
    // setup legend marks
    var titles  = dl.extend(m.titles, legendTitle(config)),
        symbols = dl.extend(m.symbols, legendSymbols(config)),
        labels  = dl.extend(m.labels, vLegendLabels(config));

    // extend legend marks
    legendSymbolExtend(symbols, size, shape, fill, stroke, opacity);

    // add / override custom style properties
    dl.extend(titles.properties.update,  titleStyle);
    dl.extend(symbols.properties.update, symbolStyle);
    dl.extend(labels.properties.update,  labelStyle);

    // padding from legend border
    titles.properties.enter.x.value += padding;
    titles.properties.enter.y.value += padding;
    labels.properties.enter.x.offset += padding + 1;
    symbols.properties.enter.x.offset = padding + 1;
    labels.properties.update.x.offset += padding + 1;
    symbols.properties.update.x.offset = padding + 1;

    dl.extend(legendDef, {
      type: 'group',
      interactive: false,
      properties: {
        enter: parseProperties(model, 'group', legendStyle),
        legendPosition: {
          encode: legendPosition.bind(null, config),
          signals: [], scales:[], data: [], fields: []
        }
      }
    });

    legendDef.marks = [titles, symbols, labels].map(function(m) { return parseMark(model, m); });
    return legendDef;
  }

  function quantDef(scale) {
    var def = q_legend_def(scale),
        dom = scale.domain(),
        data  = (values == null ? dom : values).map(ingest),
        width = (gradientStyle.width && gradientStyle.width.value) || config.gradientWidth,
        fmt = util.getTickFormat(scale, data.length, formatType, formatString);

    // build scale for label layout
    def.scales = def.scales || [{}];
    var layoutSpec = dl.extend(def.scales[0], {
      name: 'legend',
      type: scale.type,
      round: true,
      zero: false,
      domain: [dom[0], dom[dom.length-1]],
      range: [padding, width+padding]
    });
    if (scale.type==='pow') layoutSpec.exponent = scale.exponent();

    // update legend def
    var tdata = (title ? [title] : []).map(ingest);
    data.forEach(function(d,i) {
      d.label = fmt(d.data);
      d.align = i==(data.length-1) ? 'right' : i===0 ? 'left' : 'center';
    });

    def.marks[0].from = function() { return tdata; };
    def.marks[1].from = function() { return [1]; };
    def.marks[2].from = function() { return data; };
    return def;
  }

  function q_legend_def(scale) {
    // setup legend marks
    var titles = dl.extend(m.titles, legendTitle(config)),
        gradient = dl.extend(m.gradient, legendGradient(config)),
        labels = dl.extend(m.labels, hLegendLabels(config)),
        grad = new Gradient();

    // setup color gradient
    var dom = scale.domain(),
        min = dom[0],
        max = dom[dom.length-1],
        f = scale.copy().domain([min, max]).range([0,1]);

    var stops = (scale.type !== 'linear' && scale.ticks) ?
      scale.ticks.call(scale, 15) : dom;
    if (min !== stops[0]) stops.unshift(min);
    if (max !== stops[stops.length-1]) stops.push(max);

    for (var i=0, n=stops.length; i<n; ++i) {
      grad.stop(f(stops[i]), scale(stops[i]));
    }
    gradient.properties.enter.fill = {value: grad};

    // add / override custom style properties
    dl.extend(titles.properties.update, titleStyle);
    dl.extend(gradient.properties.update, gradientStyle);
    dl.extend(labels.properties.update, labelStyle);

    // account for gradient size
    var gp = gradient.properties, gh = gradientStyle.height,
        hh = (gh && gh.value) || gp.enter.height.value;
    labels.properties.enter.y.value = hh;
    labels.properties.update.y.value = hh;

    // account for title size as needed
    if (title) {
      var tp = titles.properties, fs = titleStyle.fontSize,
          sz = 4 + ((fs && fs.value) || tp.enter.fontSize.value);
      gradient.properties.enter.y.value += sz;
      labels.properties.enter.y.value += sz;
      gradient.properties.update.y.value += sz;
      labels.properties.update.y.value += sz;
    }

    // padding from legend border
    titles.properties.enter.x.value += padding;
    titles.properties.enter.y.value += padding;
    gradient.properties.enter.x.value += padding;
    gradient.properties.enter.y.value += padding;
    labels.properties.enter.y.value += padding;
    gradient.properties.update.x.value += padding;
    gradient.properties.update.y.value += padding;
    labels.properties.update.y.value += padding;

    dl.extend(legendDef, {
      type: 'group',
      interactive: false,
      properties: {
        enter: parseProperties(model, 'group', legendStyle),
        legendPosition: {
          encode: legendPosition.bind(null, config),
          signals: [], scales: [], data: [], fields: []
        }
      }
    });

    legendDef.marks = [titles, gradient, labels].map(function(m) { return parseMark(model, m); });
    return legendDef;
  }

  legend.size = function(x) {
    if (!arguments.length) return size;
    if (size !== x) { size = x; reset(); }
    return legend;
  };

  legend.shape = function(x) {
    if (!arguments.length) return shape;
    if (shape !== x) { shape = x; reset(); }
    return legend;
  };

  legend.fill = function(x) {
    if (!arguments.length) return fill;
    if (fill !== x) { fill = x; reset(); }
    return legend;
  };

  legend.stroke = function(x) {
    if (!arguments.length) return stroke;
    if (stroke !== x) { stroke = x; reset(); }
    return legend;
  };

  legend.opacity = function(x) {
    if (!arguments.length) return opacity;
    if (opacity !== x) { opacity = x; reset(); }
    return legend;
  };

  legend.title = function(x) {
    if (!arguments.length) return title;
    if (title !== x) { title = x; reset(); }
    return legend;
  };

  legend.format = function(x) {
    if (!arguments.length) return formatString;
    if (formatString !== x) {
      formatString = x;
      reset();
    }
    return legend;
  };

  legend.formatType = function(x) {
    if (!arguments.length) return formatType;
    if (formatType !== x) {
      formatType = x;
      reset();
    }
    return legend;
  };

  legend.spacing = function(x) {
    if (!arguments.length) return spacing;
    if (spacing !== +x) { spacing = +x; reset(); }
    return legend;
  };

  legend.orient = function(x) {
    if (!arguments.length) return orient;
    orient = x in LEGEND_ORIENT ? x + '' : config.orient;
    return legend;
  };

  legend.offset = function(x) {
    if (!arguments.length) return offset;
    offset = +x;
    return legend;
  };

  legend.values = function(x) {
    if (!arguments.length) return values;
    values = x;
    return legend;
  };

  legend.legendProperties = function(x) {
    if (!arguments.length) return legendStyle;
    legendStyle = x;
    return legend;
  };

  legend.symbolProperties = function(x) {
    if (!arguments.length) return symbolStyle;
    symbolStyle = x;
    return legend;
  };

  legend.gradientProperties = function(x) {
    if (!arguments.length) return gradientStyle;
    gradientStyle = x;
    return legend;
  };

  legend.labelProperties = function(x) {
    if (!arguments.length) return labelStyle;
    labelStyle = x;
    return legend;
  };

  legend.titleProperties = function(x) {
    if (!arguments.length) return titleStyle;
    titleStyle = x;
    return legend;
  };

  legend.reset = function() {
    reset();
    return legend;
  };

  return legend;
}

var LEGEND_ORIENT = {
  'left': 'x1',
  'right': 'x2',
  'top-left': 'x1',
  'top-right': 'x2',
  'bottom-left': 'x1',
  'bottom-right': 'x2'
};

function legendPosition(config, item, group, trans, db, signals, predicates) {
  var o = trans ? {} : item, i,
      def = item.mark.def,
      offset = def.offset,
      orient = def.orient,
      pad = def.padding * 2,
      ao  = orient === 'left' ? 0 : group.width,
      lw  = ~~item.bounds.width() + (item.width ? 0 : pad),
      lh  = ~~item.bounds.height() + (item.height ? 0 : pad),
      pos = group._legendPositions ||
        (group._legendPositions = {right: 0.5, left: 0.5});

  o.x = 0.5;
  o.y = 0.5;
  o.width = lw;
  o.height = lh;

  if (orient === 'left' || orient === 'right') {
    o.y = pos[orient];
    pos[orient] += lh + def.margin;

    // Calculate axis offset.
    var axes  = group.axes,
        items = group.axisItems,
        bound = LEGEND_ORIENT[orient];
    for (i=0; i<axes.length; ++i) {
      if (axes[i].orient() === orient) {
        ao = Math.max(ao, Math.abs(items[i].bounds[bound]));
      }
    }
  }

  switch (orient) {
    case 'left':
      o.x -= ao + offset + lw;
      break;
    case 'right':
      o.x += ao + offset;
      break;
    case 'top-left':
      o.x += offset;
      o.y += offset;
      break;
    case 'top-right':
      o.x += group.width - lw - offset;
      o.y += offset;
      break;
    case 'bottom-left':
      o.x += offset;
      o.y += group.height - lh - offset;
      break;
    case 'bottom-right':
      o.x += group.width - lw - offset;
      o.y += group.height - lh - offset;
      break;
  }

  var baseline = config.baseline,
      totalHeight = 0;
  for (i=0; i<group.legendItems.length; i++) {
    var currItem = group.legendItems[i];
    totalHeight += currItem.bounds.height() + (item.height ? 0 : pad);
  }

  if (baseline === 'middle') {
    o.y += offset + (group.height / 2) - (totalHeight / 2);
  } else if (baseline === 'bottom') {
    o.y += offset + group.height - totalHeight;
  }

  if (trans) trans.interpolate(item, o);
  var enc = item.mark.def.properties.enter.encode;
  enc.call(enc, item, group, trans, db, signals, predicates);
  return true;
}

function legendSymbolExtend(mark, size, shape, fill, stroke, opacity) {
  var e = mark.properties.enter,
      u = mark.properties.update;
  if (size)    e.size    = u.size    = {scale: size.scaleName,   field: 'data'};
  if (shape)   e.shape   = u.shape   = {scale: shape.scaleName,  field: 'data'};
  if (fill)    e.fill    = u.fill    = {scale: fill.scaleName,   field: 'data'};
  if (stroke)  e.stroke  = u.stroke  = {scale: stroke.scaleName, field: 'data'};
  if (opacity) u.opacity = {scale: opacity.scaleName, field: 'data'};
}

function legendTitle(config) {
  return {
    type: 'text',
    interactive: false,
    key: 'data',
    properties: {
      enter: {
        x: {value: 0},
        y: {value: 0},
        fill: {value: config.titleColor},
        font: {value: config.titleFont},
        fontSize: {value: config.titleFontSize},
        fontWeight: {value: config.titleFontWeight},
        baseline: {value: 'top'},
        text: {field: 'data'},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: { opacity: {value: 1} }
    }
  };
}

function legendSymbols(config) {
  return {
    type: 'symbol',
    interactive: false,
    key: 'data',
    properties: {
      enter: {
        x: {field: 'offset', mult: 0.5},
        y: {scale: 'legend', field: 'index'},
        shape: {value: config.symbolShape},
        size: {value: config.symbolSize},
        stroke: {value: config.symbolColor},
        strokeWidth: {value: config.symbolStrokeWidth},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: {
        x: {field: 'offset', mult: 0.5},
        y: {scale: 'legend', field: 'index'},
        opacity: {value: 1}
      }
    }
  };
}

function vLegendLabels(config) {
  return {
    type: 'text',
    interactive: false,
    key: 'data',
    properties: {
      enter: {
        x: {field: 'offset', offset: 5},
        y: {scale: 'legend', field: 'index'},
        fill: {value: config.labelColor},
        font: {value: config.labelFont},
        fontSize: {value: config.labelFontSize},
        align: {value: config.labelAlign},
        baseline: {value: config.labelBaseline},
        text: {field: 'label'},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: {
        opacity: {value: 1},
        x: {field: 'offset', offset: 5},
        y: {scale: 'legend', field: 'index'},
      }
    }
  };
}

function legendGradient(config) {
  return {
    type: 'rect',
    interactive: false,
    properties: {
      enter: {
        x: {value: 0},
        y: {value: 0},
        width: {value: config.gradientWidth},
        height: {value: config.gradientHeight},
        stroke: {value: config.gradientStrokeColor},
        strokeWidth: {value: config.gradientStrokeWidth},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: {
        x: {value: 0},
        y: {value: 0},
        opacity: {value: 1}
      }
    }
  };
}

function hLegendLabels(config) {
  return {
    type: 'text',
    interactive: false,
    key: 'data',
    properties: {
      enter: {
        x: {scale: 'legend', field: 'data'},
        y: {value: 20},
        dy: {value: 2},
        fill: {value: config.labelColor},
        font: {value: config.labelFont},
        fontSize: {value: config.labelFontSize},
        align: {field: 'align'},
        baseline: {value: 'top'},
        text: {field: 'label'},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: {
        x: {scale: 'legend', field: 'data'},
        y: {value: 20},
        opacity: {value: 1}
      }
    }
  };
}

module.exports = lgnd;
