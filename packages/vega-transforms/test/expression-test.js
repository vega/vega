var tape = require('tape');
var util = require('vega-util');
var vega = require('vega-dataflow');
var Expr = require('../').expression;

tape('Expression wraps expression functions', t => {
    var df = new vega.Dataflow();
    var f = util.accessor(
          (d, _) => d.value + _.offset,
          ['value'], 'shift'
        );
    var o = df.add(2);
    var e = df.add(Expr, {expr: f, offset: o});

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
