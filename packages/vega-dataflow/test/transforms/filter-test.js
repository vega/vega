var tape = require('tape'),
    util = require('vega-util'),
    vega = require('../../'),
    changeset = vega.changeset,
    Collect = vega.transforms.Collect,
    Filter = vega.transforms.Filter;

tape('Filter filters tuples', function(test) {
  var lt3 = util.accessor(function(d) { return d.id < 3; }, ['id']);
  var baz = util.accessor(function(d) { return d.value === 'baz'; }, ['value']);

  var data = [
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
  test.deepEqual(c1.value, data);

  df.update(e0, util.falsy).run();
  test.equal(c1.value.length, 0);

  df.update(e0, lt3).run();
  test.deepEqual(c1.value, [data[0]]);

  df.update(e0, baz).run();
  test.deepEqual(c1.value, [data[2]]);

  df.pulse(c0, changeset().modify(data[0], 'value', 'baz')).run();
  test.deepEqual(c1.value, [data[2], data[0]]);

  df.pulse(c0, changeset().modify(data[2], 'value', 'foo')).run();
  test.deepEqual(c1.value, [data[0]]);

  df.pulse(c0, changeset().modify(data[1], 'id', 4)).run();
  test.deepEqual(c1.value, [data[0]]);

  test.end();
});

tape('Filter does not leak memory', function(test) {
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
  test.equal(f0.value.empty, 0, 'Zero empty map entries');

  test.end();
});