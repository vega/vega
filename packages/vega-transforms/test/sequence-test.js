var tape = require('tape');
var field = require('vega-util').field;
var range = require('d3-array').range;
var vega = require('vega-dataflow');
var tx = require('../');
var Sequence = tx.sequence;

tape('Sequence generates sequences', t => {
    var df = new vega.Dataflow();
    var start = df.add(0);
    var stop = df.add(11);
    var step = df.add(null);
    var as = df.add(null);
    var s = df.add(Sequence, {start:start, stop:stop, step:step, as:as});

    // -- initial run
    df.run();
    t.equal(s.value.length, 11);
    t.deepEqual(s.value.map(field('data')), range(0, 11));
    t.deepEqual(s.pulse.add.map(field('data')), range(0, 11));
    t.deepEqual(s.pulse.rem, []);

    // -- set step size
    df.update(step, 2).run();
    t.equal(s.value.length, 6);
    t.deepEqual(s.value.map(field('data')), range(0, 11, 2));
    t.deepEqual(s.pulse.add.map(field('data')), range(0, 11, 2));
    t.deepEqual(s.pulse.rem.map(field('data')), range(0, 11));

    // -- set output field name
    df.update(as, 'foo').run();
    t.equal(s.value.length, 6);
    t.deepEqual(s.value.map(field('foo')), range(0, 11, 2));
    t.deepEqual(s.pulse.add.map(field('foo')), range(0, 11, 2));
    t.deepEqual(s.pulse.rem.map(field('data')), range(0, 11, 2));

    t.end();
});
