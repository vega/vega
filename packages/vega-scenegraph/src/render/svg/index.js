module.exports = {
  Handler:  require('./SVGHandler'),
  Renderer: require('./SVGRenderer'),
  string: {
    Renderer : require('./SVGStringRenderer')
  }
};