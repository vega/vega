const tape = require('tape');
const field = require('vega-util').field;
const vega = require('vega-dataflow');
const Collect = require('vega-transforms').collect;
const Nest = require('../').nest;

tape('Nest tuples', function (t) {
  const dataA = {id: 'A', job: 'Doctor'};
  const nodeA = {key: dataA.job, values: [dataA]};
  const childA = {data: dataA, height: 0, depth: 2};

  const dataB = {id: 'B', job: 'Lawyer'};
  const nodeB = {key: dataB.job, values: [dataB]};
  const childB = {data: dataB, height: 0, depth: 2};

  // Setup nest aggregation
  const df = new vega.Dataflow();
  const collect = df.add(Collect);
  const nest = df.add(Nest, {keys: [field('job')], pulse: collect});
  const out = df.add(Collect, {pulse: nest});

  // -- test adds
  df.pulse(collect, vega.changeset().insert([dataA, dataB])).run();

  let expected = [dataA, dataB];
  expected.root = {
    data: {values: [nodeA, nodeB]},
    height: 2,
    depth: 0,
    parent: null,
    children: [
      {data: nodeA, height: 1, depth: 1, children: [childA]},
      {data: nodeB, height: 1, depth: 1, children: [childB]}
    ],
    lookup: {
      [vega.tupleid(dataA)]: childA,
      [vega.tupleid(dataB)]: childB
    }
  };

  // test and remove circular properties first
  let d = out.value;
  t.equal(d.root.children[0].parent, d.root);
  t.equal(d.root.children[1].parent, d.root);
  t.equal(d.root.lookup['1'].parent, d.root.children[0]);
  t.equal(d.root.lookup['2'].parent, d.root.children[1]);
  delete d.root.children[0].parent;
  delete d.root.children[1].parent;
  delete d.root.lookup['1'].parent;
  delete d.root.lookup['2'].parent;
  t.deepEqual(d, expected);

  // -- test data removals
  df.pulse(collect, vega.changeset().remove([dataA])).run();

  expected = [dataB];
  expected.root = {
    data: {values: [nodeB]},
    height: 2,
    depth: 0,
    parent: null,
    children: [{data: nodeB, height: 1, depth: 1, children: [childB]}],
    lookup: {
      [vega.tupleid(dataB)]: childB
    }
  };

  // test and remove circular properties first
  d = out.value;
  t.equal(d.root.children[0].parent, d.root);
  t.equal(d.root.lookup['2'].parent, d.root.children[0]);
  delete d.root.children[0].parent;
  delete d.root.lookup['2'].parent;
  t.deepEqual(d, expected);

  t.end();
});

tape('Nest empty data', function (t) {
  // Setup nest aggregation
  const df = new vega.Dataflow();
  const collect = df.add(Collect);
  const nest = df.add(Nest, {keys: [field('job')], pulse: collect});
  const out = df.add(Collect, {pulse: nest});

  df.pulse(collect, vega.changeset().insert([])).run();
  t.equal(out.value.length, 0);
  const root = out.value.root;
  t.equal(root.children, undefined);
  t.deepEqual(root.lookup, {});

  t.end();
});
