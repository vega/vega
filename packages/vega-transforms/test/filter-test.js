var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Filter = tx.filter;

tape('Filter filters tuples', t => {
  const lt3 = util.accessor(d => d.id < 3, ['id']);
  const baz = util.accessor(d => d.value === 'baz', ['value']);

  const data = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ];

  var df = new vega.Dataflow(),
      e0 = df.add(null),
      c0 = df.add(Collect),
      f0 = df.add(Filter, {expr: e0, pulse: c0}),
      c1 = df.add(Collect, {pulse: f0});

  df.pulse(c0, changeset().insert(data));
  df.update(e0, util.truthy).run();
  t.deepEqual(c1.value, data);

  df.update(e0, util.falsy).run();
  t.equal(c1.value.length, 0);

  df.update(e0, lt3).run();
  t.deepEqual(c1.value, [data[0]]);

  df.update(e0, baz).run();
  t.deepEqual(c1.value, [data[2]]);

  df.pulse(c0, changeset().modify(data[0], 'value', 'baz')).run();
  t.deepEqual(c1.value, [data[2], data[0]]);

  df.pulse(c0, changeset().modify(data[2], 'value', 'foo')).run();
  t.deepEqual(c1.value, [data[0]]);

  df.pulse(c0, changeset().modify(data[1], 'id', 4)).run();
  t.deepEqual(c1.value, [data[0]]);

  t.end();
});

tape('Filter does not leak memory', t => {
  var df = new vega.Dataflow(),
      c0 = df.add(Collect),
      f0 = df.add(Filter, {expr: util.field('value'), pulse: c0}),
      n = df.cleanThreshold + 1;

  function generate() {
    for (var data = [], i=0; i<n; ++i) {
      data.push({index: i, value: 0});
    }
    return data;
  }

  // burn in by filling up to threshold, then remove all
  df.pulse(c0, changeset().insert(generate())).run();
  df.pulse(c0, changeset().remove(util.truthy)).run();
  t.equal(f0.value.empty, 0, 'Zero empty map entries');

  t.end();
});
