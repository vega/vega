var tape = require('tape');
var util = require('vega-util');
var vega = require('vega-dataflow');
var tx = require('../');
var changeset = vega.changeset;
var Collect = tx.collect;
var Quantile = tx.quantile;

tape('Quantile transform calculates empirical quantiles', t => {
    var data = [9, 8, 7, 1, 2, 3, 6, 5, 4].map(_ => ({v: _}));
    var prob = [0.25, 0.50, 0.75];

    var v = util.field('v');
    var df = new vega.Dataflow();
    var c = df.add(Collect);
    var q = df.add(Quantile, {field: v, probs: prob, pulse:c});
    var p;

    // test initial insert
    df.pulse(c, changeset().insert(data)).run();
    p = q.pulse;
    t.equal(p.add.length, 3);
    t.equal(p.rem.length, 0);
    t.equal(p.mod.length, 0);
    t.deepEqual(p.add[0], {prob: 0.25, value: 3});
    t.deepEqual(p.add[1], {prob: 0.50, value: 5});
    t.deepEqual(p.add[2], {prob: 0.75, value: 7});

    // test removal
    df.pulse(c, changeset().remove(t => t.v < 2 || t.v > 8)).run();
    p = q.pulse;
    t.equal(p.add.length, 3);
    t.equal(p.rem.length, 3);
    t.equal(p.mod.length, 0);
    t.deepEqual(p.add[0], {prob: 0.25, value: 3.5});
    t.deepEqual(p.add[1], {prob: 0.50, value: 5.0});
    t.deepEqual(p.add[2], {prob: 0.75, value: 6.5});

    // test tuple modification
    df.pulse(c, changeset()
      .modify(util.truthy, 'v', t => t.v + 1))
      .run();
    p = q.pulse;
    t.equal(p.add.length, 3);
    t.equal(p.rem.length, 3);
    t.equal(p.mod.length, 0);
    t.deepEqual(p.add[0], {prob: 0.25, value: 4.5});
    t.deepEqual(p.add[1], {prob: 0.50, value: 6.0});
    t.deepEqual(p.add[2], {prob: 0.75, value: 7.5});

    t.end();
});
