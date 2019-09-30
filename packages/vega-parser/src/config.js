import {isArray, isObject} from 'vega-util';

export default function(configs) {
  return (configs || []).reduce((out, config) => {
    for (var key in config) {
      if (key === 'signals') {
        out.signals = mergeNamed(out.signals, config.signals);
      } else {
        var r = key === 'legend' ? {'layout': 1}
          : key === 'style' ? true : null;
        copy(out, key, config[key], r);
      }
    }
    return out;
  }, defaults());
}

function copy(output, key, value, recurse) {
  var k, o;
  if (isObject(value) && !isArray(value)) {
    o = isObject(output[key]) ? output[key] : (output[key] = {});
    for (k in value) {
      if (recurse && (recurse === true || recurse[k])) {
        copy(o, k, value[k]);
      } else {
        o[k] = value[k];
      }
    }
  } else {
    output[key] = value;
  }
}

function mergeNamed(a, b) {
  if (a == null) return b;

  const map = {}, out = [];

  function add(_) {
    if (!map[_.name]) {
      map[_.name] = 1;
      out.push(_);
    }
  }

  b.forEach(add);
  a.forEach(add);
  return out;
}

var defaultFont = 'sans-serif',
    defaultSymbolSize = 30,
    defaultStrokeWidth = 2,
    defaultColor = '#4c78a8',
    black = '#000',
    gray = '#888',
    lightGray = '#ddd';

/**
 * Standard configuration defaults for Vega specification parsing.
 * Users can provide their own (sub-)set of these default values
 * by passing in a config object to the top-level parse method.
 */
function defaults() {
  return {
    // default padding around visualization
    padding: 0,

    // default for automatic sizing; options: 'none', 'pad', 'fit'
    // or provide an object (e.g., {'type': 'pad', 'resize': true})
    autosize: 'pad',

    // default view background color
    // covers the entire view component
    background: null,

    // default event handling configuration
    // preventDefault for view-sourced event types except 'wheel'
    events: {
      defaults: {allow: ['wheel']}
    },

    // defaults for top-level group marks
    // accepts mark properties (fill, stroke, etc)
    // covers the data rectangle within group width/height
    group: null,

    // defaults for basic mark types
    // each subset accepts mark properties (fill, stroke, etc)
    mark: null,
    arc: { fill: defaultColor },
    area: { fill: defaultColor },
    image: null,
    line: {
      stroke: defaultColor,
      strokeWidth: defaultStrokeWidth
    },
    path: { stroke: defaultColor },
    rect: { fill: defaultColor },
    rule: { stroke: black },
    shape: { stroke: defaultColor },
    symbol: {
      fill: defaultColor,
      size: 64
    },
    text: {
      fill: black,
      font: defaultFont,
      fontSize: 11
    },

    // style definitions
    style: {
      // axis & legend labels
      'guide-label': {
        fill: black,
        font: defaultFont,
        fontSize: 10
      },
      // axis & legend titles
      'guide-title': {
        fill: black,
        font: defaultFont,
        fontSize: 11,
        fontWeight: 'bold'
      },
      // headers, including chart title
      'group-title': {
        fill: black,
        font: defaultFont,
        fontSize: 13,
        fontWeight: 'bold'
      },
      // chart subtitle
      'group-subtitle': {
        fill: black,
        font: defaultFont,
        fontSize: 12
      },
      // defaults for styled point marks in Vega-Lite
      point: {
        size: defaultSymbolSize,
        strokeWidth: defaultStrokeWidth,
        shape: 'circle'
      },
      circle: {
        size: defaultSymbolSize,
        strokeWidth: defaultStrokeWidth
      },
      square: {
        size: defaultSymbolSize,
        strokeWidth: defaultStrokeWidth,
        shape: 'square'
      },
      // defaults for styled group marks in Vega-Lite
      cell: {
        fill: 'transparent',
        stroke: lightGray
      }
    },

    // defaults for title
    title: {
      orient: 'top',
      anchor: 'middle',
      offset: 4,
      subtitlePadding: 3
    },

    // defaults for axes
    axis: {
      minExtent: 0,
      maxExtent: 200,
      bandPosition: 0.5,
      domain: true,
      domainWidth: 1,
      domainColor: gray,
      grid: false,
      gridWidth: 1,
      gridColor: lightGray,
      labels: true,
      labelAngle: 0,
      labelLimit: 180,
      labelPadding: 2,
      ticks: true,
      tickColor: gray,
      tickOffset: 0,
      tickRound: true,
      tickSize: 5,
      tickWidth: 1,
      titlePadding: 4
    },

    // correction for centering bias
    axisBand: {
      tickOffset: -1
    },

    // defaults for cartographic projection
    projection: {
      type: 'mercator'
    },

    // defaults for legends
    legend: {
      orient: 'right',
      padding: 0,
      gridAlign: 'each',
      columnPadding: 10,
      rowPadding: 2,
      symbolDirection: 'vertical',
      gradientDirection: 'vertical',
      gradientLength: 200,
      gradientThickness: 16,
      gradientStrokeColor: lightGray,
      gradientStrokeWidth: 0,
      gradientLabelOffset: 2,
      labelAlign: 'left',
      labelBaseline: 'middle',
      labelLimit: 160,
      labelOffset: 4,
      labelOverlap: true,
      symbolLimit: 30,
      symbolType: 'circle',
      symbolSize: 100,
      symbolOffset: 0,
      symbolStrokeWidth: 1.5,
      symbolBaseFillColor: 'transparent',
      symbolBaseStrokeColor: gray,
      titleLimit: 180,
      titleOrient: 'top',
      titlePadding: 5,
      layout: {
        offset: 18,
        direction: 'horizontal',
        left:   { direction: 'vertical' },
        right:  { direction: 'vertical' }
      }
    },

    // defaults for scale ranges
    range: {
      category: {
        scheme: 'tableau10'
      },
      ordinal: {
        scheme: 'blues'
      },
      heatmap: {
        scheme: 'yellowgreenblue'
      },
      ramp: {
        scheme: 'blues'
      },
      diverging: {
        scheme: 'blueorange',
        extent: [1, 0]
      },
      symbol: [
        'circle',
        'square',
        'triangle-up',
        'cross',
        'diamond',
        'triangle-right',
        'triangle-down',
        'triangle-left'
      ]
    }
  };
}
