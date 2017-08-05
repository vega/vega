var tape = require('tape'),
    vega = require('vega-dataflow'),
    MultiExtent = require('../').multiextent;

tape('MultiExtent combines extents', function(test) {
  var df = new vega.Dataflow(),
      e = df.add([10, 50]),
      m = df.add(MultiExtent, {extents: [
        [-5, 0], [0, 20], e
      ]});

  test.equal(m.value, null);

  df.run();
  test.deepEqual(m.value, [-5, 50]);

  df.update(e, [0, 1]).run();
  test.deepEqual(m.value, [-5, 20]);

  test.end();
});
