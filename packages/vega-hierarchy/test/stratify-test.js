var field = require('vega-util').field, vega = require('vega-dataflow'), changeset = vega.changeset, Collect = require('vega-transforms').collect, Stratify = require('../').stratify;

test('Stratify tuples', function() {
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
  expect(out.value.slice()).toEqual(data);
  var root = out.value.root;
  expect(root.data).toBe(data[0]);
  expect(root.children[0].data).toBe(data[1]);
  expect(root.children[1].data).toBe(data[2]);
  expect(root.children[1].children[0].data).toBe(data[3]);
  expect(Object.keys(root.lookup).length).toBe(data.length);
});

test('Stratify empty data', function() {
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
  expect(out.value.length).toBe(0);
  var root = out.value.root;
  expect(root.children).toBe(undefined);
  expect(root.lookup).toEqual({});
});
