var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    Collect = require('../').collect,
    changeset = vega.changeset;

tape('Collect collects tuples', t => {
  const data = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ];

  var df = new vega.Dataflow(),
      so = df.add(null),
      c0 = df.add(Collect, {sort:so});

  df.run(); // initialize
  t.equal(c0.value.length, 0);
  t.equal(!!c0.modified(), false);

  // add data
  df.pulse(c0, changeset().insert(data)).run();
  t.equal(c0.value.length, 3);
  t.equal(c0.value[0], data[0]);
  t.equal(c0.value[1], data[1]);
  t.equal(c0.value[2], data[2]);
  t.equal(!!c0.modified(), true);

  // sort data
  df.update(so, util.compare('value')).run();
  t.equal(c0.value.length, 3);
  t.equal(c0.value[0], data[1]);
  t.equal(c0.value[1], data[2]);
  t.equal(c0.value[2], data[0]);
  t.equal(!!c0.modified(), true);

  // add new data
  data.push({id:2, value:'abc'});
  df.pulse(c0, changeset().insert(data[3])).run();
  t.equal(c0.value.length, 4);
  t.equal(c0.value[0], data[3]);
  t.equal(c0.value[1], data[1]);
  t.equal(c0.value[2], data[2]);
  t.equal(c0.value[3], data[0]);
  t.equal(!!c0.modified(), true);

  // remove data
  df.pulse(c0, changeset().remove(data[1])).run();
  t.equal(c0.value.length, 3);
  t.equal(c0.value[0], data[3]);
  t.equal(c0.value[1], data[2]);
  t.equal(c0.value[2], data[0]);
  t.equal(!!c0.modified(), true);

  // modify data
  df.pulse(c0, changeset().modify(data[0], 'value', 'boo')).run();
  t.equal(c0.value.length, 3);
  t.equal(c0.value[0], data[3]);
  t.equal(c0.value[1], data[2]);
  t.equal(c0.value[2], data[0]);
  t.equal(!!c0.modified(), true);

  // do nothing
  df.touch(c0).run();
  t.equal(c0.value.length, 3);
  t.equal(!!c0.modified(), false);

  t.end();
});
