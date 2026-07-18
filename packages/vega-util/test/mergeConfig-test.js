import tape from 'tape';
import * as vega from '../build/index.js';

tape('mergeConfig merges configuration objects', t => {
  t.deepEqual(
    vega.mergeConfig(
      {mark: {fill: 'blue', stroke: {value: 'black'}, dashArray: [1, 2]}},
      {mark: {stroke: {signal: '"black"'}, dashArray: [3, 4]}}
    ),
    {mark: {fill: 'blue', stroke: {signal: '"black"'}, dashArray: [3, 4]}}
  );
  t.end();
});

tape('mergeConfig merges legend objects', t => {
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

tape('mergeConfig merges signal arrays', t => {
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

tape('mergeConfig handles empty arguments', t => {
  const c = {autosize:'pad'};
  t.deepEqual(vega.mergeConfig(), {});
  t.deepEqual(vega.mergeConfig(null), {});
  t.deepEqual(vega.mergeConfig(undefined), {});
  t.deepEqual(vega.mergeConfig(c, null, undefined), c);
  t.deepEqual(vega.mergeConfig(null, c, undefined), c);
  t.deepEqual(vega.mergeConfig(null, undefined, c), c);
  t.end();
});

tape('mergeConfig must not allow prototype pollution', t => {
  const config = {symbol: {shape: 'triangle-right'}},
        payload = JSON.parse('{"__proto__": {"vulnerable": "Polluted"}}'),
        merged = vega.mergeConfig(config, payload, {symbol: payload});

  t.equal(merged.__proto__.vulnerable, undefined);
  t.equal(merged.symbol.__proto__.vulnerable, undefined);
  t.equal(Object.prototype.vulnerable, undefined);

  t.end();
});

tape('mergeConfig recursively merges style properties', t => {
  t.deepEqual(
    vega.mergeConfig(
      {
        style: {
          cell: {
            fill: 'red',
            stroke: {color: 'black', width: 1}
          }
        }
      },
      {
        style: {
          cell: {
            stroke: {color: 'blue', width: 2}
          },
          point: {size: 100}
        }
      }
    ),
    {
      style: {
        cell: {
          fill: 'red',
          stroke: {color: 'blue', width: 2}
        },
        point: {size: 100}
      }
    }
  );
  t.end();
});

tape('mergeConfig prevents __proto__ in nested recursive structures', t => {
  // Test legend layout recursion protection
  const legendPayload = JSON.parse('{"layout": {"__proto__": {"vulnerable": "Polluted"}}}');
  const legendMerged = vega.mergeConfig(
    {legend: {orient: 'right'}},
    {legend: legendPayload}
  );

  t.equal(legendMerged.legend.layout.__proto__.vulnerable, undefined);
  t.equal(Object.prototype.vulnerable, undefined);

  // Test style recursion protection
  const stylePayload = JSON.parse('{"cell": {"__proto__": {"vulnerable": "Polluted"}}}');
  const styleMerged = vega.mergeConfig(
    {style: {cell: {fill: 'red'}}},
    {style: stylePayload}
  );

  t.equal(styleMerged.style.cell.__proto__.vulnerable, undefined);
  t.equal(Object.prototype.vulnerable, undefined);

  t.end();
});

tape('mergeConfig handles multiple config arguments', t => {
  const result = vega.mergeConfig(
    {a: 1, b: 2},
    {b: 3, c: 4},
    {c: 5, d: 6},
    {d: 7, a: 8}
  );

  t.deepEqual(result, {a: 8, b: 3, c: 5, d: 7}, 'should apply configs left to right');

  t.end();
});

tape('mergeConfig only recurses legend.layout, not other legend properties', t => {
  const result = vega.mergeConfig(
    {
      legend: {
        title: {font: 'Arial', size: 12, color: 'black'},
        layout: {anchor: 'start', margin: 10}
      }
    },
    {
      legend: {
        title: {font: 'Helvetica', size: 14},
        layout: {anchor: 'end'}
      }
    }
  );

  // title should replace (no recursion for non-layout legend properties)
  t.deepEqual(result.legend.title, {font: 'Helvetica', size: 14});
  t.equal(result.legend.title.color, undefined);

  // layout should recursively merge all nested properties
  t.deepEqual(result.legend.layout, {anchor: 'end', margin: 10});

  t.end();
});
