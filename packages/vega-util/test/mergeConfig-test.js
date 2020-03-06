var tape = require('tape'),
    vega = require('../');

tape('mergeConfig merges configuration objects', function(t) {
  t.deepEqual(
    vega.mergeConfig(
      {mark: {fill: 'blue', stroke: {value: 'black'}, dashArray: [1, 2]}},
      {mark: {stroke: {signal: '"black"'}, dashArray: [3, 4]}}
    ),
    {mark: {fill: 'blue', stroke: {signal: '"black"'}, dashArray: [3, 4]}}
  );
  t.end();
});

tape('mergeConfig merges legend objects', function(t) {
  t.deepEqual(
    vega.mergeConfig(
      {
        legend: {
          orient: 'right',
          titlePadding: 5,
          layout: {
            anchor: 'start',
            left: {anchor: 'middle'},
            right: {anchor: 'start', direction: 'horizontal'}
          }
        }
      },
      {
        legend: {
          orient: 'left',
          layout: {
            anchor: 'middle',
            right: {anchor: 'middle'}
          }
        }
      }
    ),
    {
      legend: {
        orient: 'left',
        titlePadding: 5,
        layout: {
          anchor: 'middle',
          left: {anchor: 'middle'},
          right: {anchor: 'middle'}
        }
      }
    }
  );
  t.end();
});

tape('mergeConfig merges signal arrays', function(t) {
  t.deepEqual(
    vega.mergeConfig(
      {signals: [{name: 'foo', value: 1}, {name: 'bar', value: 2}]},
      {signals: [{name: 'foo', value: 3}, {name: 'baz', value: 4}]}
    ),
    {
      signals: [
        {name: 'foo', value: 3},
        {name: 'baz', value: 4},
        {name: 'bar', value: 2}
      ]
    }
  );
  t.end();
});

tape('mergeConfig handles empty arguments', function(t) {
  const c = {autosize:'pad'};
  t.deepEqual(vega.mergeConfig(), {});
  t.deepEqual(vega.mergeConfig(null), {});
  t.deepEqual(vega.mergeConfig(undefined), {});
  t.deepEqual(vega.mergeConfig(c, null, undefined), c);
  t.deepEqual(vega.mergeConfig(null, c, undefined), c);
  t.deepEqual(vega.mergeConfig(null, undefined, c), c);
  t.end();
});

tape('mergeConfig must not allow prototype pollution', function(t) {
  const config = {symbol: {shape: 'triangle-right'}},
        payload = JSON.parse('{"__proto__": {"vulnerable": "Polluted"}}'),
        merged = vega.mergeConfig(config, payload, {symbol: payload});

  t.equal(merged.__proto__.vulnerable, undefined);
  t.equal(merged.symbol.__proto__.vulnerable, undefined);
  t.equal(Object.prototype.vulnerable, undefined);

  t.end();
});