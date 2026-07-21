// DataJoin yields inside its ADD/MOD/REM loops when a cooperative scheduler
// is installed on the dataflow. The assertion that matters is not "the run
// completed" but "the join map was observed half-built from inside a yield":
// only a yield taken mid-loop can see that, so these tests fail if the
// chunking silently stops happening. Output must still match an identical
// dataflow evaluated synchronously.
import tape from 'tape';
import {field} from 'vega-util';
import {Dataflow, changeset} from 'vega-dataflow';
import {collect as Collect} from 'vega-transforms';
import {datajoin as DataJoin} from '../index.js';

// large enough that every pass crosses DataJoin's 512-item batch boundary
const N = 1200;

function data() {
  return Array.from({length: N}, (_, i) => ({key: 'k' + i, value: i}));
}

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

function join(probe) {
  const df = new Dataflow(),
        c0 = df.add(Collect),
        dj = df.add(DataJoin, {key: field('key'), pulse: c0});

  if (probe) df._scheduler = testScheduler(() => probe(dj));

  return {df, c0, dj};
}

function keys(items) {
  return items.map(item => item.datum.key);
}

tape('DataJoin yields while building the join map', async t => {
  const sizes = [],
        {df, c0, dj} = join(op => sizes.push(op.value ? op.value.size : 0));

  await df.pulse(c0, changeset().insert(data())).runAsync();

  t.ok(
    sizes.some(size => size > 0 && size < N),
    'a yield observed a partially built join map'
  );
  t.equal(dj.value.size, N, 'every tuple was joined');
  t.equal(dj.pulse.add.length, N, 'every item was added');

  const twin = join();
  await twin.df.pulse(twin.c0, changeset().insert(data())).runAsync();

  t.deepEqual(
    keys(dj.pulse.add),
    keys(twin.dj.pulse.add),
    'add set matches unscheduled evaluation, in the same order'
  );
  t.end();
});

tape('DataJoin yields while removing and modifying items', async t => {
  const empties = [];

  async function run(probe) {
    const j = join(probe);
    await j.df.pulse(j.c0, changeset().insert(data())).runAsync();

    // half the tuples are removed and half modified, so the REM and MOD
    // passes each cross the batch boundary on their own
    const tuples = j.c0.value.slice(),
          cs = changeset();
    tuples.slice(0, N / 2).forEach(tuple => cs.remove(tuple));
    tuples.slice(N / 2).forEach(tuple => cs.modify(tuple, 'value', -1));

    await j.df.pulse(j.c0, cs).runAsync();
    return j.dj;
  }

  const dj = await run(op => empties.push(op.value ? op.value.empty : 0)),
        twin = await run();

  t.ok(
    empties.some(empty => empty > 0 && empty < N / 2),
    'a yield observed a partially removed join map'
  );
  t.deepEqual(
    keys(dj.pulse.rem),
    keys(twin.pulse.rem),
    'rem set matches unscheduled evaluation, in the same order'
  );
  t.deepEqual(
    keys(dj.pulse.mod),
    keys(twin.pulse.mod),
    'mod set matches unscheduled evaluation, in the same order'
  );
  t.end();
});

tape('DataJoin stays synchronous below the batch size', async t => {
  async function returnsPromise(count) {
    const {df, c0, dj} = join(() => {}),
          run = dj.run.bind(dj);
    let thenable = false;

    dj.run = pulse => {
      const rv = run(pulse);
      thenable = !!rv.then;
      return rv;
    };

    await df.pulse(c0, changeset().insert(data().slice(0, count))).runAsync();
    return thenable;
  }

  // a pass smaller than one batch can never yield, so the size gate keeps
  // small pulses (a hover, say) off the promise-returning path entirely
  t.equal(await returnsPromise(8), false, 'small pulse joined synchronously');
  t.equal(await returnsPromise(N), true, 'large pulse joined in chunks');
  t.end();
});
