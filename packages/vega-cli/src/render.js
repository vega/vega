const vega = require('vega'),
      path = require('path'),
      args = require('./args'),
      read = require('./read');

function load(file) {
  return require(path.resolve(file));
}

const Levels = {
  error: vega.Error,
  warn:  vega.Warn,
  info:  vega.Info,
  debug: vega.Debug
};

module.exports = function(type, callback, opt) {
  // parse command line arguments
  const arg = args(type);

  // set baseURL, if specified. default to input spec directory
  const base = arg.base || (arg._[0] ? path.dirname(arg._[0]) : null);

  // set log level, defaults to logging warning messages
  const loglevel = Levels[String(arg.loglevel).toLowerCase()] || vega.Warn;

  // load config file, if specified
  const config = arg.config ? load(arg.config) : null;

  // set output image scale factor
  const scale = arg.scale || undefined;

  // use a seeded random number generator, if specified
  if (typeof arg.seed !== 'undefined') {
    if (Number.isNaN(arg.seed)) throw 'Illegal seed value: must be a valid number.';
    vega.setRandom(vega.randomLCG(arg.seed));
  }

  // locale options, load custom number/time formats if specified
  const locale = {
    number: arg.format ? load(arg.format) : null,
    time: arg.timeFormat ? load(arg.timeFormat) : null
  };

  // instantiate view and invoke headless render method
  function render(spec) {
    const view = new vega.View(vega.parse(spec, config), {
        locale: locale,                         // set locale options
        loader: vega.loader({baseURL: base}),   // load files from base path
        logger: vega.logger(loglevel, 'error'), // route all logging to stderr
        renderer: 'none'                        // no primary renderer needed
      }).finalize();                            // clear any timers, etc

    return (type === 'svg'
        ? view.toSVG(scale)
        : view.toCanvas(scale, opt)
      ).then(_ => callback(_, arg));
  }

  // read input from file or stdin
  read(arg._[0] || null)
    .then(text => render(JSON.parse(text)))
    .catch(err => console.error(err)); // eslint-disable-line no-console
};
