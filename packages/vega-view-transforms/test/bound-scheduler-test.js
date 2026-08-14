// Bound yields inside its per-item loops when a cooperative scheduler is
// installed on the dataflow. Each test observes, from inside a yield, mark
// bounds that cover only part of the mark: that state exists only while a
// chunked loop is suspended, so these tests fail if the chunking stops
// happening. Bounds must match an unscheduled twin dataflow exactly.
import tape from 'tape';
import {Dataflow, changeset} from 'vega-dataflow';
import {Bounds} from 'vega-scenegraph';
import {collect as Collect} from 'vega-transforms';
import {bound as Bound} from '../index.js';

// large enough that every loop crosses Bound's 256-item batch boundary
const N = 600;

// a scheduler that yields at every opportunity, invoking probe() at each
// suspension point so tests can observe intermediate operator state
function testScheduler(probe) {
  return {
    reset() {},
    shouldYield() { return true; },
    async yield() {
      probe();
      await new Promise(resolve => setTimeout(resolve, 0));
    },
    didAbort() { return false; }
  };
}

function scene() {
  const mark = {marktype: 'rect', role: 'mark', bounds: new Bounds(), items: []};

  for (let i = 0; i < N; ++i) {
    mark.items.push({mark, x: i, y: 0, width: 1, height: 1, bounds: new Bounds()});
  }

  return mark;
}

function setup(probe) {
  const df = new Dataflow(),
        mark = scene(),
        pad = df.add(0),
        c0 = df.add(Collect),
        bd = df.add(Bound, {mark: mark, pad: pad, pulse: c0});

  // only View defines dirty(); a bare Dataflow needs the stub the MOD
  // visitors call into
  df.dirty = () => {};

  if (probe) df._scheduler = testScheduler(() => probe(mark));

  return {df, mark, pad, c0, bd};
}

function itemBounds(mark) {
  return mark.items.map(item => [item.bounds.x1, item.bounds.x2]);
}

// the number of items already re-bounded to the given item width; this is
// zero before a bounding pass and N after it, so any value in between can
// only have been observed from inside a suspended loop
function bounded(mark, width) {
  return mark.items.filter(item => item.bounds.width() === width).length;
}

tape('Bound yields while bounding added items', async t => {
  const counts = [],
        {df, mark, c0} = setup(m => counts.push(bounded(m, 1)));

  await df.pulse(c0, changeset().insert(mark.items)).runAsync();

  t.ok(
    counts.some(count => count > 0 && count < N),
    'a yield observed a partially bounded mark'
  );
  t.equal(mark.bounds.x2, N, 'every added item was bounded');

  const twin = setup();
  await twin.df.pulse(twin.c0, changeset().insert(twin.mark.items)).runAsync();

  t.deepEqual(
    itemBounds(mark),
    itemBounds(twin.mark),
    'item bounds match unscheduled evaluation'
  );
  t.equal(mark.bounds.x2, twin.mark.bounds.x2, 'mark bounds match');
  t.end();
});

tape('Bound yields while re-bounding modified items', async t => {
  const counts = [], edges = [];
  // the setup run bounds the mark from empty, which looks just like a
  // half-finished sweep; only sample once the modify pass starts
  let watching = false;

  async function run(watch) {
    const s = setup(watch && (m => {
      if (!watching) return;
      counts.push(bounded(m, 2));
      edges.push(m.bounds.x2);
    }));
    await s.df.pulse(s.c0, changeset().insert(s.mark.items)).runAsync();

    // widening every item makes the incremental MOD pass re-bound the whole
    // mark, including the rebound sweep over mark.items
    const cs = changeset();
    s.mark.items.forEach(item => cs.modify(item, 'width', 2));
    watching = watch;
    await s.df.pulse(s.c0, cs).runAsync();
    watching = false;
    return s;
  }

  const s = await run(true),
        twin = await run(false);

  t.ok(
    counts.some(count => count > 0 && count < N),
    'a yield observed a partially re-bounded mark'
  );
  // the MOD pass only ever widens the mark, so a right edge short of the
  // pre-pass extent can only be seen partway through the rebound sweep,
  // which clears the mark bounds before re-unioning every item
  t.ok(
    edges.some(x2 => x2 > 0 && x2 < N),
    'a yield observed a partially swept rebound'
  );
  t.equal(s.mark.bounds.x2, N + 1, 'every modified item was re-bounded');
  t.deepEqual(
    itemBounds(s.mark),
    itemBounds(twin.mark),
    'item bounds match unscheduled evaluation'
  );
  t.end();
});

tape('Bound yields while re-bounding on a modified parameter', async t => {
  const counts = [];

  async function run(probe) {
    const s = setup(probe);
    await s.df.pulse(s.c0, changeset().insert(s.mark.items)).runAsync();

    // a changed operator parameter sends Bound down its re-bound-all branch,
    // which clears the mark bounds and sweeps every item
    s.mark.items.forEach(item => { item.width = 3; });
    await s.df.update(s.pad, 1).runAsync();
    return s;
  }

  const s = await run(m => counts.push(bounded(m, 3))),
        twin = await run();

  t.ok(
    counts.some(count => count > 0 && count < N),
    'a yield observed a partially re-bounded mark'
  );
  t.equal(s.mark.bounds.x2, N + 2, 'every item was re-bounded');
  t.deepEqual(
    itemBounds(s.mark),
    itemBounds(twin.mark),
    'item bounds match unscheduled evaluation'
  );
  t.end();
});

tape('Bound stays synchronous below the batch size', async t => {
  async function returnsPromise(count) {
    const {df, mark, c0, bd} = setup(() => {}),
          run = bd.run.bind(bd);
    let thenable = false;

    mark.items = mark.items.slice(0, count);
    bd.run = pulse => {
      const rv = run(pulse);
      thenable = !!rv.then;
      return rv;
    };

    await df.pulse(c0, changeset().insert(mark.items)).runAsync();
    return thenable;
  }

  // a mark smaller than one batch can never yield, so the size gate keeps
  // small marks (a hover, say) off the promise-returning path entirely
  t.equal(await returnsPromise(8), false, 'small mark bounded synchronously');
  t.equal(await returnsPromise(N), true, 'large mark bounded in chunks');
  t.end();
});
