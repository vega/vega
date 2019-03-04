var field = require('vega-util').field, range = require('d3-array').range, vega = require('vega-dataflow'), tx = require('../'), Sequence = tx.sequence;

test('Sequence generates sequences', function() {
    var df = new vega.Dataflow(),
        start = df.add(0),
        stop = df.add(11),
        step = df.add(null),
        as = df.add(null),
        s = df.add(Sequence, {start:start, stop:stop, step:step, as:as});

    // -- initial run
    df.run();
    expect(s.value.length).toBe(11);
    expect(s.value.map(field('data'))).toEqual(range(0, 11));
    expect(s.pulse.add.map(field('data'))).toEqual(range(0, 11));
    expect(s.pulse.rem).toEqual([]);

    // -- set step size
    df.update(step, 2).run();
    expect(s.value.length).toBe(6);
    expect(s.value.map(field('data'))).toEqual(range(0, 11, 2));
    expect(s.pulse.add.map(field('data'))).toEqual(range(0, 11, 2));
    expect(s.pulse.rem.map(field('data'))).toEqual(range(0, 11));

    // -- set output field name
    df.update(as, 'foo').run();
    expect(s.value.length).toBe(6);
    expect(s.value.map(field('foo'))).toEqual(range(0, 11, 2));
    expect(s.pulse.add.map(field('foo'))).toEqual(range(0, 11, 2));
    expect(s.pulse.rem.map(field('data'))).toEqual(range(0, 11, 2));
});
