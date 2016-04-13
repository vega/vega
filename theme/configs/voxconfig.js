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
  padding: 0.2
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
  padding: 2,
  axisColor: '#000',
  layer: "back",
  gridOpacity: 0.15,
  tickColor: '#000',
  tickLabelColor: '#000',
  axisWidth: 0.5,
  tickWidth: 0.5,
  tickLabelFontSize: 11,
  tickLabelFont: 'sans-serif',
  titleColor: '#000',
  titleFont: 'sans-serif',
  titleFontSize: 11,
  titleFontWeight: 'normal',
  titleOffset: 35,
  tickSize: 5,
  grid: {
    ordinal: false,
    default: true
  }
};

config.axis_x = {
  tickSizeEnd: 0,
  gridWidth: 0.2
}

config.axis_y = {
  gridWidth: 0.4,
  gridDash: [3]
}

config.marks = {
  defaultFill: '#3e5c69'
};

// default legend properties
config.legend = {
  orient: 'right',
  offset: 20,
  padding: 1,
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
  symbolShape: 'square',
  symbolSize: 50,
  symbolColor: '#888',
  symbolStrokeWidth: 0,
  titleColor: '#000',
  titleFont: 'sans-serif',
  titleFontSize: 11,
  titleFontWeight: 'bold'
};

// default color values
config.color = {
  rgb: [128, 128, 128],
  lab: [50, 0, 0],
  hcl: [0, 0, 50],
  hsl: [0, 0, 0.5]
};

var colorRange = [
    '#3e5c69',
    '#6793a6',
    '#182429',
    '#0570b0',
    '#3690c0',
    '#74a9cf',
    '#a6bddb',
    '#e2ddf2'];

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

//module.exports = config;