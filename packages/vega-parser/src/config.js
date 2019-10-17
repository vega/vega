import {scheme} from 'vega-scale';
import {scaleLinear} from 'd3-scale';
import {range} from 'd3-array';
import {interpolateLab} from 'd3-interpolate';

const tab10 = scheme('tableau10');
const defaultFont = 'sans-serif',
    defaultSymbolSize = 30,
    defaultStrokeWidth = 2,
    blue = {signal: 'colors.blue'},
    lightgray = {signal: 'colors.gray8'},
    gray = {signal: 'colors.gray5'},
    black = {signal: 'colors.gray0'};

const grays = range(11).map(scaleLinear()
  .range(["black", "white"]).domain([0,10])
  .interpolate(interpolateLab))

/**
 * Standard configuration defaults for Vega specification parsing.
 * Users can provide their own (sub-)set of these default values
 * by passing in a config object to the top-level parse method.
 */
export default function() {
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
    arc: { fill: blue },
    area: { fill: blue },
    image: null,
    line: {
      stroke: blue,
      strokeWidth: defaultStrokeWidth
    },
    path: { stroke: blue },
    rect: { fill: blue },
    rule: { stroke: black },
    shape: { stroke: blue },
    symbol: {
      fill: blue,
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
        stroke: lightgray
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
      gridColor: lightgray,
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
      gradientStrokeColor: lightgray,
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
    },

    signals: [{
      name: 'colors',
      value: {
        blue: tab10[0],
        orange: tab10[1],
        red: tab10[2],
        teal: tab10[3],
        green: tab10[4],
        yellow: tab10[5],
        purple: tab10[6],
        pink: tab10[7],
        brown: tab10[8],
        gray0: grays[0],
        gray1: grays[1],
        gray2: grays[2],
        gray3: grays[3],
        gray4: grays[4],
        gray5: grays[5],
        gray6: grays[6],
        gray7: grays[7],
        gray8: grays[8],
        gray9: grays[9],
        gray10: grays[10]
      }
    }]
  };
}
