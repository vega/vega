var tape = require('tape');
var vega = require('vega-dataflow');
var MultiExtent = require('../').multiextent;

tape('MultiExtent combines extents', t => {
  var df = new vega.Dataflow();
  var e = df.add([10, 50]);

  var m = df.add(MultiExtent, {extents: [
    [-5, 0], [0, 20], e
  ]});

  t.equal(m.value, null);

  df.run();
  t.deepEqual(m.value, [-5, 50]);

  df.update(e, [0, 1]).run();
  t.deepEqual(m.value, [-5, 20]);

  t.end();
});
