const tape = require('tape');
const util = require('vega-util');
const vega = require('vega-dataflow');
const tx = require('../');
const changeset = vega.changeset;
const Formula = tx.formula;
const Collect = tx.collect;

tape('Formula extends tuples', function (t) {
  const data = [
    {id: 1, value: 'foo'},
    {id: 3, value: 'bar'},
    {id: 5, value: 'baz'}
  ];

  const df = new vega.Dataflow();
  const x = util.field('x');
  const y = util.field('y');
  const f0 = util.accessor(
    function (t) {
      return t.id * 2;
    },
    ['id']
  );
  const f1 = util.accessor(
    function (t) {
      return t.value[0];
    },
    ['value']
  );
  const c0 = df.add(Collect);
  const fa = df.add(Formula, {expr: f0, as: 'x', pulse: c0});
  const fb = df.add(Formula, {expr: f1, as: 'y', pulse: fa});

  // add data
  df.pulse(c0, changeset().insert(data)).run();
  t.equal(fb.pulse.add.length, 3);
  t.deepEqual(c0.value.map(x), [2, 6, 10]);
  t.deepEqual(c0.value.map(y), ['f', 'b', 'b']);

  // modify data
  df.pulse(c0, changeset().modify(data[0], 'value', 'doo').modify(data[0], 'id', '2')).run();
  t.equal(fb.pulse.mod.length, 1);
  t.deepEqual(c0.value.map(x), [4, 6, 10]);
  t.deepEqual(c0.value.map(y), ['d', 'b', 'b']);

  t.end();
});
