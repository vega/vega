import tape from 'tape';
import * as vega from '../index.js';

// deterministic scatter plot specification, with enough points to
// exercise batched item drawing in the canvas renderer
function spec() {
  const points = [];
  for (let i = 0; i < 600; ++i) {
    points.push({u: i % 50, v: (i * 37) % 91});
  }

  return {
    width: 300,
    height: 200,
    padding: 5,
    data: [{name: 'table', values: points}],
    scales: [
      {name: 'x', type: 'linear', domain: {data: 'table', field: 'u'}, range: 'width'},
      {name: 'y', type: 'linear', domain: {data: 'table', field: 'v'}, range: 'height'}
    ],
    axes: [
      {orient: 'bottom', scale: 'x'},
      {orient: 'left', scale: 'y'}
    ],
    marks: [
      {
        type: 'symbol',
        from: {data: 'table'},
        encode: {
          enter: {
            x: {scale: 'x', field: 'u'},
            y: {scale: 'y', field: 'v'},
            size: {value: 16},
            fill: {value: 'steelblue'}
          }
        }
      }
    ]
  };
}

// the yield budget is internal to the View, so force a yield at every
// opportunity instead of letting a 50ms slice decide when work is chunked
function yieldAlways(view) {
  view._scheduler.shouldYield = () => true;
  return view;
}

async function run(scheduling) {
  const view = new vega.View(vega.parse(spec()), {scheduling: scheduling});
  if (view._scheduler) yieldAlways(view);
  view.initialize(); // headless canvas renderer
  await view.runAsync();
  return view;
}

tape('View scheduling produces results identical to synchronous evaluation', async t => {
  const a = await run(undefined),
        b = await run(true);

  t.equal(a._scheduler, null, 'scheduling disabled by default');
  t.ok(b._scheduler, 'scheduling enabled');

  t.deepEqual(b.data('table'), a.data('table'), 'identical datasets');
  t.equal(
    b.scenegraph().toJSON(2),
    a.scenegraph().toJSON(2),
    'identical scenegraphs'
  );
  t.ok(
    b._renderer.canvas().toBuffer().equals(a._renderer.canvas().toBuffer()),
    'identical rendered canvases'
  );

  a.finalize();
  b.finalize();
  t.end();
});

tape('View scheduling aborts reject runAsync and finalize cleanly', async t => {
  const controller = new AbortController(),
        reason = new Error('embed cancelled'),
        view = yieldAlways(new vega.View(vega.parse(spec()), {
          scheduling: {signal: controller.signal}
        }));

  view.initialize();

  const running = view.runAsync();
  controller.abort(reason);

  try {
    await running;
    t.fail('runAsync did not reject upon abort');
  } catch (error) {
    t.equal(error, reason, 'rejected with the abort reason');
  }

  t.doesNotThrow(() => view.finalize(), 'finalize is safe after abort');
  t.end();
});

tape('View finalize cancels in-flight scheduled work without a signal', async t => {
  const view = yieldAlways(new vega.View(vega.parse(spec()), {
    scheduling: {} // no caller signal
  }));

  view.initialize();

  const running = view.runAsync();
  view.finalize();

  try {
    await running;
    t.fail('runAsync did not reject when finalized mid-flight');
  } catch (error) {
    t.ok(view._scheduler.didAbort(error), 'rejected with the cancel reason');
  }
  t.end();
});

tape('View scheduling falls back to setTimeout without a scheduler global', async t => {
  // node has no global scheduler.yield; a scheduled run must still complete
  t.equal(typeof globalThis.scheduler, 'undefined');

  const view = await run(true);
  t.ok(view.scenegraph().root.items.length > 0, 'view evaluated and rendered');
  view.finalize();
  t.end();
});

// the smallest cascading specification: an autosize of 'fit' makes
// ViewLayout call back into resizeView, which changes the width and height
// signals from inside the running pulse and issues a second 'enter' pass
function fitSpec() {
  return {
    width: 200,
    height: 200,
    padding: 5,
    autosize: {type: 'fit', contains: 'padding'},
    scales: [{name: 'x', type: 'linear', domain: [0, 10], range: 'width'}],
    axes: [{orient: 'bottom', scale: 'x', title: 'u'}]
  };
}

function frame(view) {
  const group = view.scenegraph().root.items[0];
  return {width: group.width, height: group.height};
}

function captureErrors(view) {
  const errors = [];
  view.logger({
    level() {},
    error(e) { errors.push(e); },
    warn() {},
    info() {},
    debug() {}
  });
  return errors;
}

tape('View scheduling settles the autosize cascade before runAsync resolves', async t => {
  const sync = new vega.View(vega.parse(fitSpec()), {renderer: 'none'});
  sync.initialize();
  await sync.runAsync();

  const scheduled = yieldAlways(new vega.View(vega.parse(fitSpec()), {
    renderer: 'none',
    scheduling: true
  }));
  captureErrors(scheduled);
  scheduled.initialize();
  await scheduled.runAsync();

  // callers read the scenegraph -- or serialize it through toSVG/toCanvas --
  // the moment runAsync resolves, so a resolved promise has to mean the
  // fitted layout is applied, not still queued behind the run that resolved
  t.deepEqual(frame(scheduled), frame(sync), 'fitted layout applied when runAsync resolved');
  t.ok(
    vega.sceneEqual(
      JSON.parse(scheduled.scenegraph().toJSON()),
      JSON.parse(sync.scenegraph().toJSON())
    ),
    'scheduled scenegraph matches synchronous evaluation'
  );

  sync.finalize();
  scheduled.finalize();
  t.end();
});

tape('View finalize after a completed scheduled run reports no error', async t => {
  const view = yieldAlways(new vega.View(vega.parse(fitSpec()), {
          renderer: 'none',
          scheduling: true
        })),
        errors = captureErrors(view);

  view.initialize();
  await view.runAsync();
  view.finalize();

  // finalize cancels the scheduler; a run the caller already awaited to
  // completion must leave nothing behind for that cancel to abort, so a
  // clean teardown must never report a cancellation as a failure
  await new Promise(resolve => setTimeout(resolve, 20));

  t.deepEqual(errors, [], 'finalize logged nothing after a completed run');
  t.end();
});

tape('View runAsync after finalize still evaluates the scene', async t => {
  const view = yieldAlways(new vega.View(vega.parse(fitSpec()), {
          renderer: 'none',
          scheduling: true
        })),
        errors = captureErrors(view);

  view.finalize();
  await view.runAsync();

  // scene-test.js finalizes views immediately after construction -- "remove
  // timers, event listeners" -- and only then awaits runAsync. finalize must
  // cancel work that is in flight, not latch a permanent cancelled state that
  // poisons runs that have not started
  t.ok(view.scenegraph().root.items.length > 0, 'scenegraph populated after finalize then run');
  t.deepEqual(errors, [], 'no errors logged');
  t.end();
});

// the smallest specification that suspends a run on a pending load: a dataset
// fetched by url. Its Collect operator issues df.preload during construction,
// which parks evaluate at `await df._pending` until the loader resolves
function dataSpec() {
  return {
    width: 100,
    height: 100,
    data: [{name: 'table', url: 'held.json', format: {type: 'json'}}]
  };
}

tape('View finalize during a pending data load aborts the in-flight run', async t => {
  let releaseLoad;
  const held = new Promise(resolve => { releaseLoad = resolve; });

  // a loader we can hold open: load() stays pending until releaseLoad runs,
  // so df._pending stays set and the run suspends inside evaluate
  const base = vega.loader();
  let loadInvoked = false;
  const heldLoader = {
    ...base,
    load() {
      loadInvoked = true;
      return held.then(() => '[]');
    }
  };

  const view = yieldAlways(new vega.View(vega.parse(dataSpec()), {
    renderer: 'none',
    scheduling: true,
    loader: heldLoader
  }));

  // preload runs during construction, so the load is already in flight and
  // the run below is guaranteed to park at `await df._pending`
  t.ok(loadInvoked, 'loader invoked while the dataset is pending');

  const running = view.runAsync();
  view.finalize();
  releaseLoad();

  // a cancellation that arrives after the run started must abort it even if
  // the run was still waiting on data when finalize was called
  try {
    await running;
    t.fail('runAsync did not reject after finalize during a pending load');
  } catch (error) {
    t.ok(view._scheduler.didAbort(error), 'rejected with the cancel reason');
  }
  t.end();
});

tape('View runAsync after finalize renders a redraw-only run cleanly', async t => {
  const view = yieldAlways(new vega.View(vega.parse(spec()), {
          scheduling: true
        })),
        errors = captureErrors(view);

  view.initialize(); // headless canvas renderer
  await view.runAsync();

  view.finalize();

  // dirty marks the scene for re-render without touching any operator, so the
  // dataflow takes its nothing-to-do early exit and only the render phase runs
  view.dirty(view.scenegraph().root.items[0]);
  await view.runAsync();

  // finalize cancels in-flight work; a run started afterwards -- including a
  // redraw-only run that evaluates no operators -- must not be poisoned by the
  // latch finalize left armed for the render phase to trip over
  t.deepEqual(errors, [], 'redraw-only run after finalize logged no error');
  t.end();
});
