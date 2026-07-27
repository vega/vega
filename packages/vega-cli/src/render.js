import * as vega from 'vega';
import path from 'path';
import args from './args.js';
import read from './read.js';

function load(file) {}

const Levels = {
    error: vega.Error,
    warn: vega.Warn,
    info: vega.Info,
    debug: vega.Debug
};

export default function(type, callback, opt) {
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
    // Allows for other ppi settings than 72 for png files
    const ppi = arg.ppi || 72;
    // use a seeded random number generator, if specified
    if (typeof arg.seed !== 'undefined') {
        if (Number.isNaN(arg.seed))
            throw 'Illegal seed value: must be a valid number.';
        vega.setRandom(vega.randomLCG(arg.seed));
    }
    // locale options, load custom number/time formats if specified
    const locale = {
        number: arg.format ? load(arg.format) : null,
        time: arg.timeFormat ? load(arg.timeFormat) : null
    };
    // instantiate view and invoke headless render method
    async function render(spec) {
        const view = new vega.View(vega.parse(spec, config), {
            locale: locale, // set locale options
            loader: vega.loader({ baseURL: base }), // load files from base path
            logger: vega.logger(loglevel, 'error'), // route all logging to stderr
            renderer: 'none' // no primary renderer needed
        });
        // Clear timers up front, before the dataflow ever runs -- toSVG/toCanvas
        // run it for us. Order matters here: we emit a single static image, so a
        // timer-driven signal (an animation clock, say) must not be able to
        // advance while data loads. Finalizing after the run instead would make
        // the captured frame depend on how long the load happened to take.
        view.finalize();
        const image = type === 'svg'
            ? await view.toSVG(scale)
            : await view.toCanvas(scale * ppi / 72, opt);
        return callback(image, arg);
    }
    // read input from file or stdin
    read(arg._[0] || null)
        .then(text => render(JSON.parse(text)))
        .catch(err => { process.exitCode = 1; console.error(err); }); // eslint-disable-line no-console
};
