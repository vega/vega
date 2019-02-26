const vega = require('vega'),
      path = require('path'),
      args = require('./args'),
      read = require('./read');

module.exports = function(type, callback, opt) {
  // parse command line arguments
  const arg = args(type);

  // set baseURL, if specified. default to input spec directory
  const base = arg.b || (arg._[0] ? path.dirname(arg._[0]) : null);

  // load config file, if specified
  const config = arg.config ? require(path.resolve(arg.config)) : null;

  // set output image scale factor
  const scale = arg.s || undefined;

  // use a seeded random number generator, if specified
  if (typeof arg.seed !== 'undefined') {
    if (isNaN(arg.seed)) throw 'Illegal seed value: must be a valid number.';
    vega.setRandom(vega.randomLCG(arg.seed));
  }

  // instantiate view and invoke async render method
  function render(spec) {
    const view = new vega.View(vega.parse(spec, config), {
        loader: vega.loader({baseURL: base}),
        logLevel: vega.Warn,
        renderer: 'none'
      })
      .initialize()
      .finalize();

    return (type === 'svg' ? view.toSVG(scale) : view.toCanvas(scale, opt))
      .then(_ => callback(_, arg));
  }

  // read input from file or stdin
  read(arg._[0] || null)
    .then(text => render(JSON.parse(text)))
    .catch(err => console.error(err)); // eslint-disable-line no-console
}
