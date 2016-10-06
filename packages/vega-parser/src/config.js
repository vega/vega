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

/**
 * Standard configuration defaults for Vega specification parsing.
 * Users can provide their own (sub-)set of these default values
 * by passing in a config object to the top-level parse method.
 */
function defaults() {
  return {
    // default for automatic sizing; options: none, pad, fit
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
    mark: {
      arc: { fill: 'steelblue' },
      area: { fill: 'steelblue' },
      image: null,
      line: { stroke: 'steelblue' },
      path: { stroke: 'steelblue' },
      rect: { fill: 'steelblue' },
      rule: { stroke: '#000' },
      shape: { stroke: 'steelblue' },
      symbol: {
        fill: 'steelblue',
        size: 64
      },
      text: {
        fill: '#000',
        font: 'sans-serif',
        fontSize: 11
      }
    },

    // defaults for axes
    axis: {
      minExtent: 0,
      maxExtent: 200,
      bandPosition: 0.5,
      domainDefault: true,
      domainWidth: 1,
      domainColor: '#000',
      gridDefault: false,
      gridWidth: 1,
      gridColor: '#ddd',
      gridDash: [],
      gridOpacity: 1,
      tickPadding: 2,
      tickRound: true,
      tickSize: 5,
      tickWidth: 1,
      tickColor: '#000',
      tickLabelColor: '#000',
      tickLabelFont: 'sans-serif',
      tickLabelFontSize: 10,
      titleAlign: 'center',
      titlePadding: 2,
      titleColor: '#000',
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
      gradientStrokeColor: '#ddd',
      gradientStrokeWidth: 0,
      gradientLabelBaseline: 'top',
      gradientLabelOffset: 2,
      labelColor: '#000',
      labelFontSize: 10,
      labelFont: 'sans-serif',
      labelAlign: 'left',
      labelBaseline: 'middle',
      labelOffset: 8,
      symbolType: 'circle',
      symbolSize: 100,
      symbolColor: '#888',
      symbolStrokeWidth: 1.5,
      titleColor: '#000',
      titleFont: 'sans-serif',
      titleFontSize: 11,
      titleFontWeight: 'bold',
      titleAlign: 'left',
      titleBaseline: 'top'
    },

    // defaults for scale ranges
    range: {
      category: [
        '#1f77b4',
        '#ff7f0e',
        '#2ca02c',
        '#d62728',
        '#9467bd',
        '#8c564b',
        '#e377c2',
        '#7f7f7f',
        '#bcbd22',
        '#17becf'
      ],
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
