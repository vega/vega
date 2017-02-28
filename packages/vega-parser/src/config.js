import {extend, isObject} from 'vega-util';

export default function(userConfig) {
  var config = defaults(), key;
  for (key in userConfig) {
    config[key] = isObject(config[key])
      ? extend(config[key], userConfig[key])
      : config[key] = userConfig[key];
  }
  return config;
}

var defaultSymbolSize = 30,
    defaultStrokeWidth = 2,
    defaultColor = '#4c78a8',
    black = "#000",
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

    // default for automatic sizing; options: "none", "pad", "fit"
    // or provide an object (e.g., {"type": "pad", "resize": true})
    autosize: 'pad',

    // default view background color
    // covers the entire view component
    background: null,

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
      font: 'sans-serif',
      fontSize: 11
    },

    // defaults for marks using special roles
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
      strokeWidth: defaultStrokeWidth
    },

    // defaults for axes
    axis: {
      minExtent: 0,
      maxExtent: 200,
      bandPosition: 0.5,
      domain: true,
      domainWidth: 1,
      domainColor: black,
      grid: false,
      gridWidth: 1,
      gridColor: lightGray,
      gridDash: [],
      gridOpacity: 1,
      labels: true,
      labelAngle: 0,
      labelColor: black,
      labelFont: 'sans-serif',
      labelFontSize: 10,
      labelPadding: 2,
      labelLimit: 180,
      ticks: true,
      tickRound: true,
      tickSize: 5,
      tickWidth: 1,
      tickColor: black,
      titleAlign: 'center',
      titlePadding: 2,
      titleColor: black,
      titleFont: 'sans-serif',
      titleFontSize: 11,
      titleFontWeight: 'bold'
    },

    // defaults for legends
    legend: {
      orient: 'right',
      offset: 18,
      padding: 0,
      entryPadding: 5,
      titlePadding: 5,
      gradientWidth: 100,
      gradientHeight: 20,
      gradientStrokeColor: lightGray,
      gradientStrokeWidth: 0,
      gradientLabelBaseline: 'top',
      gradientLabelOffset: 2,
      labelColor: black,
      labelFontSize: 10,
      labelFont: 'sans-serif',
      labelAlign: 'left',
      labelBaseline: 'middle',
      labelOffset: 8,
      labelLimit: 160,
      symbolType: 'circle',
      symbolSize: 100,
      symbolColor: gray,
      symbolStrokeWidth: 1.5,
      titleColor: black,
      titleFont: 'sans-serif',
      titleFontSize: 11,
      titleFontWeight: 'bold',
      titleAlign: 'left',
      titleBaseline: 'top',
      titleLimit: 180
    },

    // defaults for scale ranges
    range: {
      category: {
        scheme: 'tableau10'
      },
      ordinal: {
        scheme: 'blues',
        extent: [0.2, 1]
      },
      heatmap: {
        scheme: 'viridis'
      },
      ramp: {
        scheme: 'blues',
        extent: [0.2, 1]
      },
      diverging: {
        scheme: 'blueorange'
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
