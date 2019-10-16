import {scheme} from 'vega-scale'

const tab10 = scheme('tableau10');
const defaultFont = 'sans-serif',
    defaultSymbolSize = 30,
    defaultStrokeWidth = 2

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
    arc: { fill: {signal: 'blue'} },
    area: { fill: {signal: 'blue'} },
    image: null,
    line: {
      stroke: {signal: 'blue'},
      strokeWidth: defaultStrokeWidth
    },
    path: { stroke: {signal: 'blue'} },
    rect: { fill: {signal: 'blue'} },
    rule: { stroke: {signal: 'black'} },
    shape: { stroke: {signal: 'blue'} },
    symbol: {
      fill: {signal: 'blue'},
      size: 64
    },
    text: {
      fill: {signal: 'black'},
      font: defaultFont,
      fontSize: 11
    },

    // style definitions
    style: {
      // axis & legend labels
      'guide-label': {
        fill: {signal: 'black'},
        font: defaultFont,
        fontSize: 10
      },
      // axis & legend titles
      'guide-title': {
        fill: {signal: 'black'},
        font: defaultFont,
        fontSize: 11,
        fontWeight: 'bold'
      },
      // headers, including chart title
      'group-title': {
        fill: {signal: 'black'},
        font: defaultFont,
        fontSize: 13,
        fontWeight: 'bold'
      },
      // chart subtitle
      'group-subtitle': {
        fill: {signal: 'black'},
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
        stroke: {signal: 'lightgray'}
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
      domainColor: {signal: 'gray'},
      grid: false,
      gridWidth: 1,
      gridColor: {signal: 'lightgray'},
      labels: true,
      labelAngle: 0,
      labelLimit: 180,
      labelPadding: 2,
      ticks: true,
      tickColor: {signal: 'gray'},
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
      gradientStrokeColor: {signal: 'lightgray'},
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
      symbolBaseStrokeColor: {signal: 'gray'},
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
      name: 'blue',
      value: tab10[0]
    }, {
      name: 'orange',
      value: tab10[1]
    }, {
      name: 'red',
      value: tab10[2]
    }, {
      name: 'teal',
      value: tab10[3]
    }, {
      name: 'green',
      value: tab10[4]
    }, {
      name: 'yellow',
      value: tab10[5]
    }, {
      name: 'purple',
      value: tab10[6]
    }, {
      name: 'pink',
      value: tab10[7]
    }, {
      name: 'brown',
      value: tab10[8]
    }, {
      name: 'black',
      value: 'black'
    }, {
      name: 'darkgray',
      value: 'darkgrey'
    }, {
      name: 'gray',
      value: 'grey'
    }, {
      name: 'silver',
      value: 'silver'
    }, {
      name: 'lightgray',
      value: 'lightgrey'
    }, {
      name: 'white',
      value: 'white'
    }]
  };
}
