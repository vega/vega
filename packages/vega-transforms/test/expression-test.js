var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    Expr = require('../').expression;

tape('Expression wraps expression functions', function(test) {
  var df = new vega.Dataflow(),
      f = util.accessor(
            function(d, _) { return d.value + _.offset; },
            ['value'], 'shift'
          ),
      o = df.add(2),
      e = df.add(Expr, {expr: f, offset: o});

  df.run();
  test.equal(typeof e.value, 'function');
  test.equal(util.accessorName(e.value), 'shift');
  test.deepEqual(util.accessorFields(e.value), ['value']);
  test.equal(e.value({value: 2}), 4);

  df.update(o, 5).run();
  test.equal(typeof e.value, 'function');
  test.equal(util.accessorName(e.value), 'shift');
  test.deepEqual(util.accessorFields(e.value), ['value']);
  test.equal(e.value({value: 2}), 7);

  test.end();
});
