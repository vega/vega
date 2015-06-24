var args = ['datum', 'event', 'signals'];

module.exports = require('vega-expression')
  .compiler(args, args[0], args[2]);
