import {default as Pulse, StopPropagation} from '../Pulse';
import MultiPulse from '../MultiPulse';
import UniqueList from '../util/UniqueList';
import {id, isArray, Info, Debug} from 'vega-util';

/**
 * Runs the dataflow. This method will increment the current timestamp
 * and process all updated, pulsed and touched operators. When run for
 * the first time, all registered operators will be processed. If there
 * are pending data loading operations, this method will return immediately
 * without evaluating the dataflow. Instead, the dataflow will be
 * asynchronously invoked when data loading completes. To track when dataflow
 * evaluation completes, use the {@link runAsync} method instead.
 * @param {string} [encode] - The name of an encoding set to invoke during
 *   propagation. This value is added to generated Pulse instances;
 *   operators can then respond to (or ignore) this setting as appropriate.
 *   This parameter can be used in conjunction with the Encode transform in
 *   the vega-encode module.
 */
export function run(encode) {
  var df = this,
      count = 0,
      level = df.logLevel(),
      op, next, dt, error;

  if (df._pending) {
    df.info('Awaiting requests, delaying dataflow run.');
    return 0;
  }

  if (df._pulse) {
    df.error('Dataflow invoked recursively. Use the runAfter method to queue invocation.');
    return 0;
  }

  if (!df._touched.length) {
    df.info('Dataflow invoked, but nothing to do.');
    return 0;
  }

  df._pulse = new Pulse(df, ++df._clock, encode);

  if (level >= Info) {
    dt = Date.now();
    df.debug('-- START PROPAGATION (' + df._clock + ') -----');
  }

  // initialize queue, reset touched operators
  df._touched.forEach(function(op) { df._enqueue(op, true); });
  df._touched = UniqueList(id);

  try {
    while (df._heap.size() > 0) {
      op = df._heap.pop();

      // re-queue if rank changes
      if (op.rank !== op.qrank) { df._enqueue(op, true); continue; }

      // otherwise, evaluate the operator
      next = op.run(df._getPulse(op, encode));

      if (level >= Debug) {
        df.debug(op.id, next === StopPropagation ? 'STOP' : next, op);
      }

      // propagate the pulse
      if (next !== StopPropagation) {
        df._pulse = next;
        if (op._targets) op._targets.forEach(function(op) { df._enqueue(op); });
      }

      // increment visit counter
      ++count;
    }
  } catch (err) {
    error = err;
  }

  // reset pulse map
  df._pulses = {};
  df._pulse = null;

  if (level >= Info) {
    dt = Date.now() - dt;
    df.info('> Pulse ' + df._clock + ': ' + count + ' operators; ' + dt + 'ms');
  }

  if (error) {
    df._postrun = [];
    df.error(error);
  }

  if (df._onrun) {
    try { df._onrun(df, count, error); } catch (err) { df.error(err); }
  }

  // invoke callbacks queued via runAfter
  if (df._postrun.length) {
    var postrun = df._postrun;
    df._postrun = [];
    postrun
      .sort(function(a, b) { return b.priority - a.priority; })
      .forEach(function(_) { invokeCallback(df, _.callback); });
  }

  return this;
}

function invokeCallback(df, callback) {
  try { callback(df); } catch (err) { df.error(err); }
}

/**
 * Runs the dataflow and returns a Promise that resolves when the
 * propagation cycle completes. The standard run method may exit early
 * if there are pending data loading operations. In contrast, this
 * method returns a Promise to allow callers to receive notification
 * when dataflow evaluation completes.
 * @return {Promise} - A promise that resolves to this dataflow.
 */
export function runAsync() {
  // return this._pending || Promise.resolve(this.run());
  return this._pending
    || (this.run() && this._pending)
    || Promise.resolve(this);
}

/**
 * Schedules a callback function to be invoked after the current pulse
 * propagation completes. If no propagation is currently occurring,
 * the function is invoked immediately.
 * @param {function(Dataflow)} callback - The callback function to run.
 *   The callback will be invoked with this Dataflow instance as its
 *   sole argument.
 * @param {boolean} enqueue - A boolean flag indicating that the
 *   callback should be queued up to run after the next propagation
 *   cycle, suppressing immediate invocation when propagation is not
 *   currently occurring.
 */
export function runAfter(callback, enqueue, priority) {
  if (this._pulse || enqueue) {
    // pulse propagation is currently running, queue to run after
    this._postrun.push({
      priority: priority || 0,
      callback: callback
    });
  } else {
    // pulse propagation already complete, invoke immediately
    invokeCallback(this, callback);
  }
}

/**
 * Enqueue an operator into the priority queue for evaluation. The operator
 * will be enqueued if it has no registered pulse for the current cycle, or if
 * the force argument is true. Upon enqueue, this method also sets the
 * operator's qrank to the current rank value.
 * @param {Operator} op - The operator to enqueue.
 * @param {boolean} [force] - A flag indicating if the operator should be
 *   forceably added to the queue, even if it has already been previously
 *   enqueued during the current pulse propagation. This is useful when the
 *   dataflow graph is dynamically modified and the operator rank changes.
 */
export function enqueue(op, force) {
  var p = !this._pulses[op.id];
  if (p) this._pulses[op.id] = this._pulse;
  if (p || force) {
    op.qrank = op.rank;
    this._heap.push(op);
  }
}

/**
 * Provide a correct pulse for evaluating an operator. If the operator has an
 * explicit source operator, we will try to pull the pulse(s) from it.
 * If there is an array of source operators, we build a multi-pulse.
 * Otherwise, we return a current pulse with correct source data.
 * If the pulse is the pulse map has an explicit target set, we use that.
 * Else if the pulse on the upstream source operator is current, we use that.
 * Else we use the pulse from the pulse map, but copy the source tuple array.
 * @param {Operator} op - The operator for which to get an input pulse.
 * @param {string} [encode] - An (optional) encoding set name with which to
 *   annotate the returned pulse. See {@link run} for more information.
 */
export function getPulse(op, encode) {
  var s = op.source,
      stamp = this._clock,
      p;

  if (s && isArray(s)) {
    p = s.map(function(_) { return _.pulse; });
    return new MultiPulse(this, stamp, p, encode);
  }

  p = this._pulses[op.id];
  if (s) {
    s = s.pulse;
    if (!s || s === StopPropagation) {
      p.source = [];
    } else if (s.stamp === stamp && p.target !== op) {
      p = s;
    } else {
      p.source = s.source;
    }
  }

  return p;
}
