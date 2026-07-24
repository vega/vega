// Dataflow consumes an optional cooperative scheduler via its _scheduler
// property (null by default, set by vega-view's opt-in scheduling option).
// The scheduler contract is reset(), shouldYield(), yield() and
// didAbort(error). Evaluation yields between operator evaluations, and
// expensive operators additionally yield inside their per-item loops via
// the visitChunked helper. Re-entrant runs queue behind the in-flight run,
// so no other evaluation mutates pulse state while an operator is
// suspended; an abort surfaces as a rejection of the in-flight run promise
// with the signal's reason.
import tape from 'tape';
import * as vega from '../index.js';

// a test scheduler that requests a yield between every operator
// evaluation, maximally exercising scheduled evaluation code paths
function testScheduler(signal) {
  const s = {
    yields: 0,
    signal: signal || null,
    reset() {},
    shouldYield() { return true; },
    async yield() {
      if (s.signal && s.signal.aborted) throw s.signal.reason;
      s.yields += 1;
      await new Promise(resolve => setTimeout(resolve, 0));
      if (s.signal && s.signal.aborted) throw s.signal.reason;
    },
    didAbort(error) {
      return s.signal != null && s.signal.aborted && error === s.signal.reason;
    }
  };
  return s;
}

tape('Dataflow propagates values when yielding via a scheduler', async t => {
  const df = new vega.Dataflow(),
        scheduler = testScheduler(),
        s1 = df.add(10),
        s2 = df.add(3),
        n1 = df.add(_ => _.s1 + 0.25, {s1: s1}),
        n2 = df.add(_ => _.n1 * _.s2, {n1: n1, s2: s2}),
        op = [s1, s2, n1, n2],
        stamp = function(_) { return _.stamp; };

  df._scheduler = scheduler;

  await df.runAsync();
  t.equal(df.stamp(), 1);
  t.deepEqual(op.map(stamp), [1, 1, 1, 1]);
  t.equal(n2.value, 30.75);
  t.ok(scheduler.yields > 0, 'yielded during evaluation');

  await df.update(s1, 5).runAsync();
  t.equal(df.stamp(), 2);
  t.deepEqual(op.map(stamp), [2, 1, 2, 2]);
  t.equal(n2.value, 15.75);

  await df.update(s2, 1).runAsync();
  t.equal(df.stamp(), 3);
  t.deepEqual(op.map(stamp), [2, 3, 2, 3]);
  t.equal(n2.value, 5.25);

  t.end();
});

tape('Dataflow queues runs issued while a scheduled run yields', async t => {
  const df = new vega.Dataflow(),
        s1 = df.add(1),
        n1 = df.add(_ => _.s1 * 2, {s1: s1});

  df._scheduler = testScheduler();

  // the second run queues until the first completes, then applies its
  // prerun update, mirroring how view event listeners issue runs
  const first = df.runAsync();
  const second = df.runAsync(null, () => { df.update(s1, 3); });

  await first;
  await second;

  t.equal(df.stamp(), 2, 'both runs evaluated');
  t.equal(n1.value, 6);
  t.end();
});

tape('Dataflow rejects an aborted run with the abort reason', async t => {
  const df = new vega.Dataflow(),
        controller = new AbortController(),
        reason = new Error('run cancelled'),
        s1 = df.add(10),
        n1 = df.add(_ => {
          // abort in mid-propagation; the next yield point rejects
          controller.abort(reason);
          return _.s1 + 1;
        }, {s1: s1}),
        n2 = df.add(_ => _.n1 * 2, {n1: n1});

  df._scheduler = testScheduler(controller.signal);

  try {
    await df.runAsync();
    t.fail('run did not reject upon abort');
  } catch (error) {
    t.equal(error, reason, 'rejected with the abort reason');
  }

  t.equal(df._pulse, null, 'pulse state was reset');
  t.equal(df._heap.size(), 0, 'operator queue was cleared');
  t.equal(n2.value, null, 'downstream operator did not evaluate');

  // dataflow evaluation resumes once the scheduler is removed
  df._scheduler = null;
  await df.update(s1, 20).runAsync();
  t.equal(n2.value, 42);
  t.end();
});

tape('Dataflow run() logs rather than throws when a scheduled run aborts', async t => {
  const df = new vega.Dataflow(),
        controller = new AbortController(),
        reason = new Error('run cancelled'),
        errors = [];

  df.add(1);
  df._scheduler = testScheduler(controller.signal);
  df.logger({
    level() {},
    error(e) { errors.push(e); },
    warn() {},
    info() {},
    debug() {}
  });

  controller.abort(reason);
  df.run();

  // wait for the rejected evaluation to settle
  await new Promise(resolve => setTimeout(resolve, 10));

  t.deepEqual(errors, [reason], 'abort reason was logged');
  t.end();
});

tape('Dataflow evaluates queued runs after a scheduled run aborts', async t => {
  const df = new vega.Dataflow(),
        controller = new AbortController(),
        reason = new Error('run cancelled'),
        s1 = df.add(1),
        n1 = df.add(_ => _.s1 * 2, {s1: s1});

  df._scheduler = testScheduler(controller.signal);

  // a queued run must reflect its own outcome, not inherit the rejection
  // of the aborted run it was queued behind
  const first = df.runAsync();
  const second = df.runAsync(null, () => {
    df._scheduler = null;
    df.update(s1, 3);
  });
  controller.abort(reason);

  try {
    await first;
    t.fail('in-flight run did not reject upon abort');
  } catch (error) {
    t.equal(error, reason, 'in-flight run rejected with the abort reason');
  }

  await second;
  t.equal(n1.value, 6, 'queued run evaluated after the aborted run settled');
  t.end();
});

tape('Dataflow run() queues behind an in-flight scheduled run', async t => {
  const df = new vega.Dataflow(),
        s1 = df.add(1),
        n1 = df.add(_ => _.s1 * 2, {s1: s1});

  df._scheduler = testScheduler();

  let release;
  const gate = new Promise(resolve => { release = resolve; });

  // hold the first run open after its dataflow phase completes; _pulse is
  // already null there, modeling the view's scheduled render phase
  const first = df.runAsync(null, null, () => gate);
  await new Promise(resolve => setTimeout(resolve, 10));
  t.equal(n1.value, 2, 'first run propagated');
  t.equal(df._pulse, null, 'no pulse while the first run is held open');

  df.update(s1, 3).run();
  await new Promise(resolve => setTimeout(resolve, 10));
  t.equal(n1.value, 2, 'run() queued instead of evaluating mid-flight');

  release();
  await first;
  await new Promise(resolve => setTimeout(resolve, 10));
  t.equal(n1.value, 6, 'queued run evaluated after the first completed');
  t.end();
});

tape('Dataflow logs an abort of the queued async-transform rerun', async t => {
  const df = new vega.Dataflow(),
        controller = new AbortController(),
        reason = new Error('run cancelled'),
        errors = [];

  df.logger({
    level() {},
    error(e) { errors.push(e); },
    warn() {},
    info() {},
    debug() {}
  });

  let resolveAsync;
  const asyncWork = new Promise(resolve => { resolveAsync = resolve; });

  class AsyncTransform extends vega.Transform {
    transform() { return {async: asyncWork}; }
  }

  const s1 = df.add(7);
  df.add(new AsyncTransform(), {s1: s1});

  df._scheduler = testScheduler(controller.signal);

  // the initial run completes, leaving the async transform work pending
  await df.runAsync();
  t.deepEqual(errors, [], 'initial run completed without error');

  // abort, then complete the async work; the rerun it queues aborts and
  // must be routed to error() rather than left as an unhandled rejection
  controller.abort(reason);
  resolveAsync(dataflow => dataflow.update(s1, 8));
  await new Promise(resolve => setTimeout(resolve, 20));

  t.deepEqual(errors, [reason], 'rerun abort reason was logged');
  t.end();
});

tape('Dataflow runAsync resolves only after runs cascaded from runAfter', async t => {
  const df = new vega.Dataflow(),
        s1 = df.add(1),
        n1 = df.add(_ => _.s1 * 2, {s1: s1});

  df._scheduler = testScheduler();

  // this is the shape of the view's autosize path: a callback drained
  // inside the in-flight evaluation issues a follow-up run. That run
  // continues the cycle the caller asked for, so runAsync must not resolve
  // until it has propagated -- otherwise the caller reads state from the
  // middle of a cycle it was told had finished
  df.runAfter(dataflow => { dataflow.update(s1, 3).run(); }, true);

  await df.runAsync();

  t.equal(df.stamp(), 2, 'cascaded run evaluated before runAsync resolved');
  t.equal(n1.value, 6, 'cascaded run propagated before runAsync resolved');
  t.end();
});

tape('visitChunked visits every entry in order', async t => {
  const array = Array.from({length: 10}, (_, i) => i),
        seen = [],
        indices = [];

  await vega.visitChunked(array, (value, index, source) => {
    seen.push(value);
    indices.push(index);
    t.equal(source, array, 'visitor receives the source array');
  }, testScheduler(), 4);

  // chunking is an implementation detail; callers depend on visiting the
  // whole array exactly once, in order, with visitArray's argument shape
  t.deepEqual(seen, array, 'visited every entry in order');
  t.deepEqual(indices, array, 'visited with source array indices');
  t.end();
});

tape('visitChunked yields once per batch boundary', async t => {
  const scheduler = testScheduler(),
        array = Array.from({length: 10}, (_, i) => i);

  // batches of 4 over 10 entries means boundaries before entries 4 and 8
  await vega.visitChunked(array, () => {}, scheduler, 4);
  t.equal(scheduler.yields, 2, 'yielded at each batch boundary');

  // a single batch has no boundary to yield at, so a small pass stays
  // effectively synchronous even under an always-yield scheduler
  scheduler.yields = 0;
  await vega.visitChunked(array, () => {}, scheduler, 10);
  t.equal(scheduler.yields, 0, 'no yield when the array fits one batch');

  scheduler.yields = 0;
  await vega.visitChunked([], () => {}, scheduler, 4);
  t.equal(scheduler.yields, 0, 'no yield for an empty array');
  t.end();
});

tape('visitChunked only yields when the scheduler asks', async t => {
  const scheduler = testScheduler(),
        array = Array.from({length: 10}, (_, i) => i);

  scheduler.shouldYield = () => false;
  await vega.visitChunked(array, () => {}, scheduler, 4);

  t.equal(scheduler.yields, 0, 'batch boundaries do not force a yield');
  t.end();
});

tape('visitChunked propagates an abort thrown from yield', async t => {
  const controller = new AbortController(),
        reason = new Error('run cancelled'),
        scheduler = testScheduler(controller.signal),
        array = Array.from({length: 10}, (_, i) => i),
        seen = [];

  controller.abort(reason);

  try {
    await vega.visitChunked(array, value => seen.push(value), scheduler, 4);
    t.fail('visitChunked did not reject upon abort');
  } catch (error) {
    t.equal(error, reason, 'rejected with the abort reason');
  }

  // the abort lands at the first batch boundary, leaving the tail unvisited
  t.deepEqual(seen, [0, 1, 2, 3], 'stopped visiting at the batch boundary');
  t.end();
});
