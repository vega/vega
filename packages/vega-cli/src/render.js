import * as vega from 'vega';
import path from 'path';
import { createRequire } from 'module';
import args from './args.js';
import read from './read.js';

const require = createRequire(import.meta.url);

// load a JSON file, or a JS file that exports an object
function load(file, flag) {
    try {
        const value = require(path.resolve(file));
        return value?.[Symbol.toStringTag] === 'Module' ? value.default : value;
    }
    catch (err) {
        throw `Could not load --${flag} file "${file}": ${err.message.split('\n')[0]}`;
    }
}

const Levels = {
    error: vega.Error,
    warn: vega.Warn,
    info: vega.Info,
    debug: vega.Debug
};

function fail(err) {
    process.exitCode = 1;
    console.error(err); // eslint-disable-line no-console
}

export default function(type, callback, opt) {
    try {
        main(type, callback, opt);
    }
    catch (err) {
        fail(err);
    }
};

function main(type, callback, opt) {
    // parse command line arguments
    const arg = args(type);
    // set baseURL, if specified. default to input spec directory
    const base = arg.base || (arg._[0] ? path.dirname(arg._[0]) : null);
    // set log level, defaults to logging warning messages
    const loglevel = Levels[String(arg.loglevel).toLowerCase()] || vega.Warn;
    // load config file, if specified
    const config = arg.config ? load(arg.config, 'config') : null;
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
        number: arg.format ? load(arg.format, 'format') : null,
        time: arg.timeFormat ? load(arg.timeFormat, 'timeFormat') : null
    };
    // instantiate view and invoke headless render method
    function render(spec) {
        const view = new vega.View(vega.parse(spec, config), {
            locale: locale, // set locale options
            loader: vega.loader({ baseURL: base }), // load files from base path
            logger: vega.logger(loglevel, 'error'), // route all logging to stderr
            renderer: 'none' // no primary renderer needed
        }).finalize(); // clear any timers, etc
        return (type === 'svg'
            ? view.toSVG(scale)
            : view.toCanvas(scale * ppi / 72, opt)).then(_ => callback(_, arg));
    }
    // read input from file or stdin
    read(arg._[0] || null)
        .then(text => render(JSON.parse(text)))
        .catch(fail);
}
