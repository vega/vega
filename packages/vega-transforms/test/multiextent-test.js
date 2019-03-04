var vega = require('vega-dataflow'), MultiExtent = require('../').multiextent;

test('MultiExtent combines extents', function() {
  var df = new vega.Dataflow(),
      e = df.add([10, 50]),
      m = df.add(MultiExtent, {extents: [
        [-5, 0], [0, 20], e
      ]});

  expect(m.value).toBe(null);

  df.run();
  expect(m.value).toEqual([-5, 50]);

  df.update(e, [0, 1]).run();
  expect(m.value).toEqual([-5, 20]);
});
