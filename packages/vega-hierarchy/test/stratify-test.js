const tape = require('tape');
const field = require('vega-util').field;
const vega = require('vega-dataflow');
const changeset = vega.changeset;
const Collect = require('vega-transforms').collect;
const Stratify = require('../').stratify;

tape('Stratify tuples', function (t) {
  const data = [{id: 'a'}, {id: 'b', pid: 'a'}, {id: 'c', pid: 'a'}, {id: 'd', pid: 'c'}];

  // Setup tree stratification
  const df = new vega.Dataflow();
  const collect = df.add(Collect);
  const nest = df.add(Stratify, {
    key: field('id'),
    parentKey: field('pid'),
    pulse: collect
  });
  const out = df.add(Collect, {pulse: nest});

  // build tree
  df.pulse(collect, changeset().insert(data)).run();
  t.deepEqual(out.value.slice(), data);
  const root = out.value.root;
  t.equal(root.data, data[0]);
  t.equal(root.children[0].data, data[1]);
  t.equal(root.children[1].data, data[2]);
  t.equal(root.children[1].children[0].data, data[3]);
  t.equal(Object.keys(root.lookup).length, data.length);

  t.end();
});

tape('Stratify empty data', function (t) {
  // Setup tree stratification
  const df = new vega.Dataflow();
  const collect = df.add(Collect);
  const nest = df.add(Stratify, {
    key: field('id'),
    parentKey: field('pid'),
    pulse: collect
  });
  const out = df.add(Collect, {pulse: nest});

  df.pulse(collect, changeset().insert([])).run();
  t.equal(out.value.length, 0);
  const root = out.value.root;
  t.equal(root.children, undefined);
  t.deepEqual(root.lookup, {});

  t.end();
});
