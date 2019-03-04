var util = require('vega-util'), vega = require('vega-dataflow'), Expr = require('../').expression;

test('Expression wraps expression functions', function() {
    var df = new vega.Dataflow(),
        f = util.accessor(
              function(d, _) { return d.value + _.offset; },
              ['value'], 'shift'
            ),
        o = df.add(2),
        e = df.add(Expr, {expr: f, offset: o});

    df.run();
    expect(typeof e.value).toBe('function');
    expect(util.accessorName(e.value)).toBe('shift');
    expect(util.accessorFields(e.value)).toEqual(['value']);
    expect(e.value({value: 2})).toBe(4);

    df.update(o, 5).run();
    expect(typeof e.value).toBe('function');
    expect(util.accessorName(e.value)).toBe('shift');
    expect(util.accessorFields(e.value)).toEqual(['value']);
    expect(e.value({value: 2})).toBe(7);
});
