var d3 = require('d3'),
    config = {};

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

// default axis properties
config.axis = {
  layer: 'back',
  ticks: 10,
  padding: 3,
  axisColor: '#000',
  axisWidth: 1,
  gridColor: '#000',
  gridOpacity: 0.15,
  tickColor: '#000',
  tickLabelColor: '#000',
  tickWidth: 1,
  tickSize: 6,
  tickLabelFontSize: 11,
  tickLabelFont: 'sans-serif',
  titleColor: '#000',
  titleFont: 'sans-serif',
  titleFontSize: 11,
  titleFontWeight: 'bold',
  titleOffset: 'auto',
  titleOffsetAutoMin: 30,
  titleOffsetAutoMax: 10000,
  titleOffsetAutoMargin: 4
};

// default legend properties
config.legend = {
  orient: 'right',
  offset: 20,
  padding: 3, // padding between legend items and border
  margin: 2,  // extra margin between two consecutive legends
  gradientStrokeColor: '#888',
  gradientStrokeWidth: 1,
  gradientHeight: 16,
  gradientWidth: 100,
  labelColor: '#000',
  labelFontSize: 10,
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

// default color values
config.color = {
  rgb: [128, 128, 128],
  lab: [50, 0, 0],
  hcl: [0, 0, 50],
  hsl: [0, 0, 0.5]
};

// default scale ranges
config.range = {
  category10:  d3.scale.category10().range(),
  category20:  d3.scale.category20().range(),
  category20b: d3.scale.category20b().range(),
  category20c: d3.scale.category20c().range(),
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
