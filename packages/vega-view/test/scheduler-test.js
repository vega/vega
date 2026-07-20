// The scheduler matches vega-embed's yielding semantics: it pauses via
// scheduler.yield() from the Prioritized Task Scheduling API when available
// (so continuations inherit the priority of whatever task invoked runAsync),
// falling back to setTimeout(0) otherwise. It never calls postTask or sets
// an explicit priority. Work is chunked on a time budget (default 10ms)
// measured against performance.now(), and the abort signal is checked both
// before and after every yield so an abort rejects with the signal's reason.
import tape from 'tape';
import scheduler from '../src/scheduler.js';

tape('scheduler is disabled unless requested', t => {
  t.equal(scheduler(undefined), null);
  t.equal(scheduler(false), null);
  t.ok(scheduler(true), 'enabled via boolean flag');
  t.ok(scheduler({}), 'enabled via options object');
  t.equal(scheduler(true).signal, null);
  t.end();
});

tape('scheduler yields on a time budget', async t => {
  const s = scheduler(true);

  s.reset();
  t.equal(s.shouldYield(), false, 'no yield within a fresh budget');

  const exhausted = scheduler(true, -1);
  exhausted.reset();
  t.equal(exhausted.shouldYield(), true, 'yield once budget is exhausted');

  // in environments without a global scheduler.yield, such as node,
  // yielding falls back to setTimeout without crashing
  await exhausted.yield();
  t.pass('yield resolved via setTimeout fallback');

  s.reset();
  await s.yield();
  t.equal(s.shouldYield(), false, 'yield starts a new time budget');
  t.end();
});

tape('scheduler uses scheduler.yield() when available', async t => {
  let calls = 0;
  globalThis.scheduler = {yield: () => { ++calls; return Promise.resolve(); }};
  try {
    const s = scheduler(true);
    await s.yield();
    await s.yield();
    t.equal(calls, 2, 'yields delegate to the scheduler global');
  } finally {
    delete globalThis.scheduler;
  }
  t.end();
});

tape('scheduler surfaces aborts at yield points', async t => {
  const controller = new AbortController(),
        reason = new Error('run cancelled'),
        s = scheduler({signal: controller.signal});

  t.equal(s.signal, controller.signal);

  s.reset();
  t.equal(s.shouldYield(), false);
  await s.yield();
  t.pass('yield resolves while signal is not aborted');

  controller.abort(reason);
  t.equal(s.shouldYield(), true, 'aborted signal requests a yield');

  try {
    await s.yield();
    t.fail('yield did not reject upon abort');
  } catch (error) {
    t.equal(error, reason, 'rejected with the abort reason');
  }

  t.equal(s.didAbort(reason), true);
  t.equal(s.didAbort(new Error('other')), false);
  t.end();
});

tape('scheduler cancel() aborts subsequent yields', async t => {
  const s = scheduler(true),
        reason = new Error('view finalized');

  s.reset();
  t.equal(s.shouldYield(), false);

  s.cancel(reason);
  t.equal(s.shouldYield(), true, 'cancelled scheduler requests a yield');

  try {
    await s.yield();
    t.fail('yield did not reject after cancel');
  } catch (error) {
    t.equal(error, reason, 'rejected with the cancel reason');
  }

  t.equal(s.didAbort(reason), true, 'cancel reason registers as an abort');
  t.equal(s.didAbort(new Error('other')), false);

  // cancel without an explicit reason still rejects with an Error
  const fallback = scheduler(true);
  fallback.cancel();
  try {
    await fallback.yield();
    t.fail('yield did not reject after cancel without a reason');
  } catch (error) {
    t.ok(error instanceof Error, 'default cancel reason is an Error');
  }
  t.end();
});

tape('scheduler reset keeps the cancel reason as an identity tombstone', async t => {
  const s = scheduler(true),
        reason = new Error('view finalized');

  s.reset();
  s.cancel(reason);
  t.equal(s.shouldYield(), true, 'cancelled scheduler requests a yield');

  try {
    await s.yield();
    t.fail('yield did not reject after cancel');
  } catch (error) {
    t.equal(error, reason, 'rejected with the cancel reason');
  }
  t.equal(s.didAbort(reason), true, 'cancel reason registers as an abort');

  // every run resets the scheduler at its start. reset lifts the cancelled
  // flag so the fresh run is not poisoned, yet the reason survives as a
  // tombstone: a later run must never make an earlier cancellation
  // unrecognizable to whoever still holds its rejected error
  s.reset();
  t.equal(s.shouldYield(), false, 'reset clears the cancellation for a fresh deadline');
  await s.yield();
  t.pass('yield resolves after reset -- the scheduler is no longer poisoned');
  t.equal(s.didAbort(reason), true, 'the earlier cancel reason is still an abort after reset');

  // a fresh cancellation after a reset installs a new reason, which becomes
  // the one and only active cancellation identity
  const next = new Error('cancelled again');
  s.cancel(next);
  t.equal(s.didAbort(next), true, 'a cancel after reset registers its new reason');
  t.equal(s.didAbort(reason), false, 'the superseded reason is no longer the active cancellation');
  t.end();
});
