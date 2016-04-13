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
config.background = '#f9f9f9';

// default axis properties
config.axis = {
  orient: 'bottom',
  ticks: 10,
  padding: 2,
  axisColor: '#979797',
  layer: "back",
  gridOpacity: 0.15,
  tickColor: '#979797',
  tickLabelColor: '#979797',
  axisWidth: 0.5,
  tickWidth: 0.2,
  tickLabelFontSize: 11,
  tickLabelFont: 'sans-serif',
  titleColor: '#979797',
  titleFont: 'sans-serif',
  titleFontSize: 11,
  titleFontWeight: 'normal',
  titleOffset: 35,
  gridWidth: 0.2
};

config.axis_x = {
  tickSize: 10,
  tickSizeEnd: 0,
  grid: {
    ordinal: false,
    default: true
  }
}

config.axis_y = {
  tickSize: 0,
  axisColor: 'transparent',
  grid: true
}

config.marks = {
  defaultFill: '#ab5787',
  symbolSize: 20
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
    '#ab5787',
    '#51b2e5',
    '#703c5c',
    '#168dd9',
    '#d190b6',
    '#00609f',
    '#d365ba',
    '#154866',
    '#666666',
    '#c4c4c4'];

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