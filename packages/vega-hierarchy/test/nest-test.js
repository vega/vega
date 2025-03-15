import tape from 'tape';
import { field } from 'vega-util';
import { Dataflow, changeset, tupleid } from 'vega-dataflow';
import { collect as Collect } from 'vega-transforms';
import { nest as Nest } from '../index.js';

function toObject(value) {
  return JSON.parse(JSON.stringify(value));
}

tape('Nest tuples', t => {
  var dataA = {id: 'A', job: 'Doctor'},
      nodeA = {key: dataA.job, values: [dataA]},
      childA = {data: dataA, height: 0, depth: 2};

  var dataB = {id: 'B', job: 'Lawyer'},
      nodeB = {key: dataB.job, values: [dataB]},
      childB = {data: dataB, height: 0, depth: 2};

  // Setup nest aggregation
  const df = new Dataflow(),
        collect = df.add(Collect),
        nest = df.add(Nest, { keys: [field('job')], pulse: collect }),
        out = df.add(Collect, { pulse: nest });

  // -- test adds
  df.pulse(collect, changeset().insert([dataA, dataB])).run();

  let expected = [dataA, dataB];
  let expectedRoot = {
    data: {values: [nodeA, nodeB]},
    height: 2,
    depth: 0,
    parent: null,
    children: [
      {data: nodeA, height: 1, depth: 1, children: [childA]},
      {data: nodeB, height: 1, depth: 1, children: [childB]}
    ],
    lookup: {
      [tupleid(dataA)]: childA,
      [tupleid(dataB)]: childB
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
  t.deepEqual(toObject(d), expected);
  t.deepEqual(toObject(d.root), expectedRoot);

  // -- test data removals
  df.pulse(collect, changeset().remove([dataA])).run();

  expected = [dataB];
  expectedRoot = {
    data: {values: [nodeB]},
    height: 2,
    depth: 0,
    parent: null,
    children: [
      {data: nodeB, height: 1, depth: 1, children: [childB]}
    ],
    lookup: {
      [tupleid(dataB)]: childB
    }
  };

  // test and remove circular properties first
  d = out.value;
  t.equal(d.root.children[0].parent, d.root);
  t.equal(d.root.lookup['2'].parent, d.root.children[0]);
  delete d.root.children[0].parent;
  delete d.root.lookup['2'].parent;
  t.deepEqual(toObject(d), expected);
  t.deepEqual(toObject(d.root), expectedRoot);

  t.end();
});

tape('Nest empty data', t => {
  // Setup nest aggregation
  const df = new Dataflow(),
        collect = df.add(Collect),
        nest = df.add(Nest, { keys: [field('job')], pulse: collect }),
        out = df.add(Collect, { pulse: nest });

  df.pulse(collect, changeset().insert([])).run();
  t.equal(out.value.length, 0);
  var root = out.value.root;
  t.equal(root.children, undefined);
  t.deepEqual(root.lookup, {});

  t.end();
});
