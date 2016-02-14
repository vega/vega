var d3 = require('d3');
var config = {};

config.load = {
  // base url for loading external data files
  // used only for server-side operation
  baseURL: '',
  // Allows domain restriction when using data loading via XHR.
  // To enable, set it to a list of allowed domains
  // e.g., ['wikipedia.org', 'eff.org']
  domainWhiteList: false
};

// inset padding for automatic padding calculation
config.autopadInset = 5;

// extensible scale lookup table
// all d3.scale.* instances also supported
config.scale = {
  time: d3.time.scale,
  utc:  d3.time.scale.utc
};

// default rendering settings
config.render = {
  retina: true
};

// root scenegraph group
config.scene = {
  fill: undefined,
  fillOpacity: undefined,
  stroke: undefined,
  strokeOpacity: undefined,
  strokeWidth: undefined,
  strokeDash: undefined,
  strokeDashOffset: undefined
};

config.width = 400;
config.height = 200;
config.background = '#FFF';

// default axis properties
config.axis = {
  orient: 'bottom',
  ticks: 10,
  padding: 10,
  axisColor: '#000',
  gridOpacity: 1,
  tickColor: '#000',
  tickLabelColor: '#000',
  axisWidth: 1,
  tickWidth: 0.5,
  tickLabelFontSize: 11,
  tickLabelFont: 'sans-serif',
  titleColor: '#000',
  titleFont: 'sans-serif',
  titleFontSize: 11,
  titleFontWeight: 'bold',
  titleOffset: 35,
  tickSize: 5,
  tickPlacement: 'between',
  grid: {
    ordinal: false,
    default: true
  },
  layer: "back",
  gridWidth: 0.5,
  gridColor: '#000000'
};

config.scales = {
  padding: 0.2
};

// default legend properties
config.legend = {
  orient: 'right',
  offset: 20,
  padding: 3,
  baseline: 'middle',
  gradientStrokeColor: '#888',
  gradientStrokeWidth: 1,
  gradientHeight: 16,
  gradientWidth: 100,
  labelColor: '#000',
  labelFontSize: 11,
  labelFont: 'sans-serif',
  labelAlign: 'left',
  labelBaseline: 'middle',
  labelOffset: 8,
  symbolSize: 60,
  symbolColor: '#888',
  symbolStrokeWidth: 0,
  titleColor: '#000',
  titleFont: 'sans-serif',
  titleFontSize: 11,
  titleFontWeight: 'bold'
};

config.marks = {
  defaultFill: 'steelblue',
  symbolSize: 50
};

// default color values
config.color = {
  rgb: [128, 128, 128],
  lab: [50, 0, 0],
  hcl: [0, 0, 50],
  hsl: [0, 0, 0.5]
};

var colorRange = [
    '#4572a7',
    '#aa4643',
    '#8aa453',
    '#71598e',
    '#4598ae',
    '#d98445',
    '#94aace',
    '#d09393',
    '#b9cc98',
    '#a99cbc'];

config.customShapes = {
  star: {
    "M": "0, 4",
    "L": [
      "4.702, 6.472",
      "3.804, 1.236",
      "7.608, -2.472",
      "2.351, -3.236",
      "0, -8",
      "-2.351, -3.236",
      "-7.608, -2.472",
      "-3.804, 1.236",
      "-4.702, 6.472",
      "0, 4"
    ],
    "Z": ""
  }
};

// default scale ranges
config.range = {
  category10:  colorRange,
  category20:  colorRange,
  category20b: colorRange,
  category20c: colorRange,
  shapes: [
    'circle',
    'cross',
    'diamond',
    'square',
    'triangle-down',
    'triangle-up'
  ]
};

module.exports = config;