//var d3 = require('d3');
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
  utc:  d3.time.scale.utc,
  padding: 0.1
};

// default rendering settings
config.render = {
  retina: true
};

config.width = 480;
config.height = 288;

// root scenegraph group
config.scene = {
  fill: '#e5e5e5',
  fillOpacity: undefined,
  stroke: undefined,
  strokeOpacity: undefined,
  strokeWidth: undefined,
  strokeDash: undefined,
  strokeDashOffset: undefined
};

// default axis properties
config.axis = {
  grid: true,
  layer: "back",
  orient: 'bottom',
  ticks: 10,
  padding: 4,
  axisColor: 'transparent',
  gridColor: '#FFFFFF',
  gridOpacity: 1,
  tickColor: '#7F7F7F',
  tickLabelColor: '#7F7F7F',
  axisWidth: 1,
  tickWidth: 1,
  tickSize: 5.67,
  tickLabelFontSize: 11,
  tickLabelFont: 'sans-serif',
  titleColor: '#000',
  titleFont: 'sans-serif',
  titleFontSize: 16,
  titleFontWeight: 'normal',
  titleOffset: 35
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
  symbolShape: 'circle',
  symbolSize: 50,
  symbolColor: '#888',
  symbolStrokeWidth: 1,
  titleColor: '#000',
  titleFont: 'sans-serif',
  titleFontSize: 11,
  titleFontWeight: 'bold'
};

config.marks = {
  color: '#000000',
  symbolSize: 30
};

// default color values
config.color = {
  rgb: [128, 128, 128],
  lab: [50, 0, 0],
  hcl: [0, 0, 50],
  hsl: [0, 0, 0.5]
};

var grayRange = [
    '#000000',
    '#7F7F7F',
    '#1A1A1A',
    '#999999',
    '#333333',
    '#B0B0B0',
    '#4D4D4D',
    '#C9C9C9',
    '#666666',
    '#DCDCDC']

// default scale ranges
config.range = {
  category10:  grayRange,
  colorscale: [
    '#f57670',
    '#1fbec3',
    '#40b41e',
    '#9593fc',
    '#a3a420',
    '#9f9df9',
    '#1ebd7f',
    '#d68f21',
    '#fd66bb',
    '#1eb1f3'
  ],
  category20:  grayRange,
  category20b: grayRange,
  category20c: grayRange,
  shapes: [
    'circle',
    'cross',
    'diamond',
    'square',
    'triangle-down',
    'triangle-up'
  ]
};

//module.exports = config;