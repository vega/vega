var tape = require('tape'),
    field = require('vega-util').field,
    vega = require('vega-dataflow'),
    changeset = vega.changeset,
    Collect = require('vega-transforms').collect,
    Stratify = require('../').stratify;

tape('Stratify tuples', function(test) {
  var data = [
    {id: 'a'},
    {id: 'b', pid: 'a'},
    {id: 'c', pid: 'a'},
    {id: 'd', pid: 'c'},
  ];

  // Setup tree stratification
  var df = new vega.Dataflow(),
      collect = df.add(Collect),
      nest = df.add(Stratify, {
        key: field('id'),
        parentKey: field('pid'),
        pulse: collect
      }),
      out = df.add(Collect, {pulse: nest});

  // build tree
  df.pulse(collect, changeset().insert(data)).run();
  test.deepEqual(out.value.slice(), data);
  var root = out.value.root;
  test.equal(root.data, data[0]);
  test.equal(root.children[0].data, data[1]);
  test.equal(root.children[1].data, data[2]);
  test.equal(root.children[1].children[0].data, data[3]);
  test.equal(Object.keys(root.lookup).length, data.length);

  test.end();
});

tape('Stratify empty data', function(test) {
  // Setup tree stratification
  var df = new vega.Dataflow(),
      collect = df.add(Collect),
      nest = df.add(Stratify, {
        key: field('id'),
        parentKey: field('pid'),
        pulse: collect
      }),
      out = df.add(Collect, {pulse: nest});

  df.pulse(collect, changeset().insert([])).run();
  test.equal(out.value.length, 0);
  var root = out.value.root;
  test.equal(root.children, undefined);
  test.deepEqual(root.lookup, {});

  test.end();
});
