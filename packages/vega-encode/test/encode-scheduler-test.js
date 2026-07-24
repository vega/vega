// Encode yields inside its ADD, MOD and REFLOW loops when a cooperative
// scheduler is installed on the dataflow. Each test observes, from inside a
// yield, a tuple set that is only partly encoded: that state exists only
// while a chunked loop is suspended, so these tests fail if the chunking
// stops happening. Encoded output must match an unscheduled twin dataflow.
import tape from 'tape';
import {Dataflow, changeset} from 'vega-dataflow';
import {collect as Collect} from 'vega-transforms';
import {encode as Encode} from '../index.js';

// large enough that every pass crosses Encode's 256-item batch boundary
const N = 600;

function data() {
  return Array.from({length: N}, (_, i) => ({value: i}));
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

function encoder(fn, output) {
  fn.output = output;
  return fn;
}

const enter = encoder(item => { item.entered = true; return true; }, ['entered']),
      update = encoder((item, _) => { item.out = item.value + _.level; return true; }, ['out']);

// the number of tuples whose encoded output reflects the current level
function encoded(tuples, level) {
  return tuples.filter(t => t.out === t.value + level).length;
}

// tuples carry a symbol-keyed id that differs per dataflow, so compare the
// encoded fields rather than the tuple objects themselves
function output(tuples) {
  return tuples.map(t => [t.value, t.out, t.entered]);
}

function setup(probe) {
  const df = new Dataflow(),
        tuples = data(),
        level = df.add(0),
        c0 = df.add(Collect),
        en = df.add(Encode, {encoders: {enter, update}, level: level, pulse: c0});

  if (probe) df._scheduler = testScheduler(() => probe(tuples));

  return {df, tuples, level, c0, en};
}

tape('Encode yields while encoding added tuples', async t => {
  const counts = [],
        {df, tuples, c0, en} = setup(items => counts.push(encoded(items, 0)));

  await df.pulse(c0, changeset().insert(tuples)).runAsync();

  t.ok(
    counts.some(count => count > 0 && count < N),
    'a yield observed a partially encoded add set'
  );
  t.equal(encoded(tuples, 0), N, 'every added tuple was encoded');
  t.equal(en.pulse.add.length, N, 'every tuple reached the output pulse');

  const twin = setup();
  await twin.df.pulse(twin.c0, changeset().insert(twin.tuples)).runAsync();
  t.deepEqual(output(tuples), output(twin.tuples), 'matches unscheduled evaluation');
  t.end();
});

tape('Encode yields while encoding modified tuples', async t => {
  const counts = [];

  async function run(probe) {
    const s = setup(probe);
    await s.df.pulse(s.c0, changeset().insert(s.tuples)).runAsync();

    // restamping every value leaves all encoded outputs stale, so the MOD
    // pass has to visit the whole set to bring them back into agreement
    const cs = changeset();
    s.tuples.forEach(tuple => cs.modify(tuple, 'value', tuple.value + 1));
    await s.df.pulse(s.c0, cs).runAsync();
    return s;
  }

  const s = await run(items => counts.push(encoded(items, 0))),
        twin = await run();

  t.ok(
    counts.some(count => count > 0 && count < N),
    'a yield observed a partially re-encoded mod set'
  );
  t.equal(encoded(s.tuples, 0), N, 'every modified tuple was re-encoded');
  t.equal(s.en.pulse.mod.length, N, 'every tuple reached the output pulse');
  t.deepEqual(output(s.tuples), output(twin.tuples), 'matches unscheduled evaluation');
  t.end();
});

tape('Encode yields while reflowing on a modified parameter', async t => {
  const counts = [];

  async function run(probe) {
    const s = setup(probe);
    await s.df.pulse(s.c0, changeset().insert(s.tuples)).runAsync();

    // a changed encoder parameter makes _.modified() true with an empty mod
    // set, which sends Encode over the backing source via REFLOW
    await s.df.update(s.level, 1).runAsync();
    return s;
  }

  const s = await run(items => counts.push(encoded(items, 1))),
        twin = await run();

  t.ok(
    counts.some(count => count > 0 && count < N),
    'a yield observed a partially reflowed source'
  );
  t.equal(encoded(s.tuples, 1), N, 'every source tuple was re-encoded');
  t.equal(s.en.pulse.mod.length, N, 'every tuple reached the output pulse');
  t.deepEqual(output(s.tuples), output(twin.tuples), 'matches unscheduled evaluation');
  t.end();
});

tape('Encode stays synchronous below the batch size', async t => {
  async function returnsPromise(count) {
    const {df, tuples, c0, en} = setup(() => {}),
          run = en.run.bind(en);
    let thenable = false;

    en.run = pulse => {
      const rv = run(pulse);
      thenable = !!rv.then;
      return rv;
    };

    await df.pulse(c0, changeset().insert(tuples.slice(0, count))).runAsync();
    return thenable;
  }

  // a pass smaller than one batch can never yield, so the size gate keeps
  // small pulses (a hover, say) off the promise-returning path entirely
  t.equal(await returnsPromise(8), false, 'small pulse encoded synchronously');
  t.equal(await returnsPromise(N), true, 'large pulse encoded in chunks');
  t.end();
});
