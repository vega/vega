var tape = require('tape'),
    field = require('vega-util').field,
    vega = require('vega-dataflow'),
    changeset = vega.changeset,
    Collect = require('vega-transforms').collect,
    Nest = require('../').nest;

tape('Nest tuples', function(test) {
  var dataA = {id: 'A', job: 'Doctor'},
      nodeA = {key: dataA.job, values: [dataA]},
      childA = {data: dataA, height: 0, depth: 2};

  var dataB = {id: 'B', job: 'Lawyer'},
      nodeB = {key: dataB.job, values: [dataB]},
      childB = {data: dataB, height: 0, depth: 2};

  // Setup nest aggregation
  var df = new vega.Dataflow(),
      collect = df.add(Collect),
      nest = df.add(Nest, {keys: [field('job')], pulse: collect}),
      out = df.add(Collect, {pulse: nest});

  // -- test adds
  df.pulse(collect, changeset().insert([dataA, dataB])).run();

  var expected = [dataA, dataB];
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
  var d = out.value;
  test.equal(d.root.children[0].parent, d.root);
  test.equal(d.root.children[1].parent, d.root);
  test.equal(d.root.lookup['1'].parent, d.root.children[0]);
  test.equal(d.root.lookup['2'].parent, d.root.children[1]);
  delete d.root.children[0].parent;
  delete d.root.children[1].parent;
  delete d.root.lookup['1'].parent;
  delete d.root.lookup['2'].parent;
  test.deepEqual(d, expected);


  // -- test data removals
  df.pulse(collect, changeset().remove([dataA])).run();

  expected = [dataB];
  expected.root = {
    data: {values: [nodeB]},
    height: 2,
    depth: 0,
    parent: null,
    children: [
      {data: nodeB, height: 1, depth: 1, children: [childB]}
    ],
    lookup: {
      [vega.tupleid(dataB)]: childB
    }
  };

  // test and remove circular properties first
  d = out.value;
  test.equal(d.root.children[0].parent, d.root);
  test.equal(d.root.lookup['2'].parent, d.root.children[0]);
  delete d.root.children[0].parent;
  delete d.root.lookup['2'].parent;
  test.deepEqual(d, expected);

  test.end();
});
