const tape = require('tape');
const util = require('vega-util');
const vega = require('vega-dataflow');
const Expr = require('../').expression;

tape('Expression wraps expression functions', function (t) {
  const df = new vega.Dataflow();
  const f = util.accessor(
    function (d, _) {
      return d.value + _.offset;
    },
    ['value'],
    'shift'
  );
  const o = df.add(2);
  const e = df.add(Expr, {expr: f, offset: o});

  df.run();
  t.equal(typeof e.value, 'function');
  t.equal(util.accessorName(e.value), 'shift');
  t.deepEqual(util.accessorFields(e.value), ['value']);
  t.equal(e.value({value: 2}), 4);

  df.update(o, 5).run();
  t.equal(typeof e.value, 'function');
  t.equal(util.accessorName(e.value), 'shift');
  t.deepEqual(util.accessorFields(e.value), ['value']);
  t.equal(e.value({value: 2}), 7);

  t.end();
});
