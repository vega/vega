config.background = '#FFF';
config.height = 200;
config.padding = {"top": 10, "left": 30, "bottom": 30, "right": 10};
config.width = 400;

config.axis = {
  orient: 'bottom',
  ticks: 10,
  padding: 10,
  axisColor: '#000',
  axisWidth: 1,
  grid: true,
  gridColor: '#0000000',
  gridDash: [2]
  gridOpacity: 1,
  gridWidth: 0.5,
  layer: "back",
  tickColor: '#000',
  tickLabelColor: '#000',
  tickLabelFontSize: 1,
  tickLabelFont: 'sans-serif',
  titleColor: '#000',
  titleFont: 'sans-serif',
  titleFontSize: 11,
  titleFontWeight: 'bold',
  titleOffset: 35,
  tickSize: 5,
  tickSizeEnd: 0,
  tickPlacement: 'between',
  tickWidth: 0.5,
};

config.axis_x = {
  // same properties as config.axis
}

config.axis_y = {
  // same properties as config.axis
}

config.scales = {
  padding: 0.6,
  outerPadding: 0.3
};

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
  labelFontSize: 1,
  labelFont: 'sans-serif',
  labelAlign: 'left',
  labelBaseline: 'middle',
  labelOffset: 8,
  symbolShape: {
    line: 'diamond',
    symbol: 'circle',
    rect: 'circle',
    arc: 'square',
    default: 'diamond'
  },
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
  symbolSize: 10
};