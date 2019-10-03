var tape = require('tape'),
    vega = require('../');

tape('mergeConfig merges configs', function(t) {
  t.deepEqual(vega.mergeConfig({}, {}), {});

  t.deepEqual(vega.mergeConfig({
    a: 1, b: 2,
  }, {
    a: 3, c: 4
  }), {
    a: 3, b: 2, c: 4
  });

  t.deepEqual(vega.mergeConfig({ a: [1] }, { a: [2] }), { a: [2] });

  t.deepEqual(vega.mergeConfig({
    signals: [{name: 'a', value: 1}, {name: 'b', value: 2}],
  }, {
    signals: [{name: 'a', value: 2}, {name: 'c', value: 3}]
  }), {
    signals: [{name: 'a', value: 2}, {name: 'b', value: 2}, {name: 'c', value: 3}]
  });

  t.end();
});
