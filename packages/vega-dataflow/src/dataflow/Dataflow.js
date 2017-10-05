import add from './add';
import connect from './connect';
import events from './events';
import {ingest, request} from './load';
import on from './on';
import {rank, rerank} from './rank';
import {run, runAsync, runAfter, enqueue, getPulse} from './run';
import {pulse, touch, update} from './update';
import changeset from '../ChangeSet';
import Heap from '../util/Heap';
import UniqueList from '../util/UniqueList';
import {loader} from 'vega-loader';
import {id, logger, Error} from 'vega-util';

/**
 * A dataflow graph for reactive processing of data streams.
 * @constructor
 */
export default function Dataflow() {
  this._log = logger();
  this.logLevel(Error);

  this._clock = 0;
  this._rank = 0;
  try {
    this._loader = loader();
  } catch (e) {
    // do nothing if loader module is unavailable
  }

  this._touched = UniqueList(id);
  this._pulses = {};
  this._pulse = null;

  this._heap = new Heap(function(a, b) { return a.qrank - b.qrank; });
  this._postrun = [];
}

var prototype = Dataflow.prototype;

/**
 * The current timestamp of this dataflow. This value reflects the
 * timestamp of the previous dataflow run. The dataflow is initialized
 * with a stamp value of 0. The initial run of the dataflow will have
 * a timestap of 1, and so on. This value will match the
 * {@link Pulse.stamp} property.
 * @return {number} - The current timestamp value.
 */
prototype.stamp = function() {
  return this._clock;
};

/**
 * Gets or sets the loader instance to use for data file loading. A
 * loader object must provide a "load" method for loading files and a
 * "sanitize" method for checking URL/filename validity. Both methods
 * should accept a URI and options hash as arguments, and return a Promise
 * that resolves to the loaded file contents (load) or a hash containing
 * sanitized URI data with the sanitized url assigned to the "href" property
 * (sanitize).
 * @param {object} _ - The loader instance to use.
 * @return {object|Dataflow} - If no arguments are provided, returns
 *   the current loader instance. Otherwise returns this Dataflow instance.
 */
prototype.loader = function(_) {
  if (arguments.length) {
    this._loader = _;
    return this;
  } else {
    return this._loader;
  }
};

/**
 * Empty entry threshold for garbage cleaning. Map data structures will
 * perform cleaning once the number of empty entries exceeds this value.
 */
prototype.cleanThreshold = 1e4;

// OPERATOR REGISTRATION
prototype.add = add;
prototype.connect = connect;
prototype.rank = rank;
prototype.rerank = rerank;

// OPERATOR UPDATES
prototype.pulse = pulse;
prototype.touch = touch;
prototype.update = update;
prototype.changeset = changeset;

// DATA LOADING
prototype.ingest = ingest;
prototype.request = request;

// EVENT HANDLING
prototype.events = events;
prototype.on = on;

// PULSE PROPAGATION
prototype.run = run;
prototype.runAsync = runAsync;
prototype.runAfter = runAfter;
prototype._enqueue = enqueue;
prototype._getPulse = getPulse;

// LOGGING AND ERROR HANDLING

function logMethod(method) {
  return function() {
    return this._log[method].apply(this, arguments);
  };
}

/**
 * Logs an error message. By default, logged messages are written to console
 * output. The message will only be logged if the current log level is high
 * enough to permit error messages.
 */
prototype.error = logMethod('error');

/**
 * Logs a warning message. By default, logged messages are written to console
 * output. The message will only be logged if the current log level is high
 * enough to permit warning messages.
 */
prototype.warn = logMethod('warn');

/**
 * Logs a information message. By default, logged messages are written to
 * console output. The message will only be logged if the current log level is
 * high enough to permit information messages.
 */
prototype.info = logMethod('info');

/**
 * Logs a debug message. By default, logged messages are written to console
 * output. The message will only be logged if the current log level is high
 * enough to permit debug messages.
 */
prototype.debug = logMethod('debug');

/**
 * Get or set the current log level. If an argument is provided, it
 * will be used as the new log level.
 * @param {number} [level] - Should be one of None, Warn, Info
 * @return {number} - The current log level.
 */
prototype.logLevel = logMethod('level');
