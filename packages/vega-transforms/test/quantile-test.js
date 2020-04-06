const tape = require('tape');
const util = require('vega-util');
const vega = require('vega-dataflow');
const tx = require('../');
const changeset = vega.changeset;
const Collect = tx.collect;
const Quantile = tx.quantile;

tape('Quantile transform calculates empirical quantiles', function (t) {
  const data = [9, 8, 7, 1, 2, 3, 6, 5, 4].map(_ => ({v: _}));
  const prob = [0.25, 0.5, 0.75];

  const v = util.field('v');
  const df = new vega.Dataflow();
  const c = df.add(Collect);
  const q = df.add(Quantile, {field: v, probs: prob, pulse: c});
  let p;

  // test initial insert
  df.pulse(c, changeset().insert(data)).run();
  p = q.pulse;
  t.equal(p.add.length, 3);
  t.equal(p.rem.length, 0);
  t.equal(p.mod.length, 0);
  t.deepEqual(p.add[0], {prob: 0.25, value: 3});
  t.deepEqual(p.add[1], {prob: 0.5, value: 5});
  t.deepEqual(p.add[2], {prob: 0.75, value: 7});

  // test removal
  df.pulse(
    c,
    changeset().remove(t => t.v < 2 || t.v > 8)
  ).run();
  p = q.pulse;
  t.equal(p.add.length, 3);
  t.equal(p.rem.length, 3);
  t.equal(p.mod.length, 0);
  t.deepEqual(p.add[0], {prob: 0.25, value: 3.5});
  t.deepEqual(p.add[1], {prob: 0.5, value: 5.0});
  t.deepEqual(p.add[2], {prob: 0.75, value: 6.5});

  // test tuple modification
  df.pulse(
    c,
    changeset().modify(util.truthy, 'v', t => t.v + 1)
  ).run();
  p = q.pulse;
  t.equal(p.add.length, 3);
  t.equal(p.rem.length, 3);
  t.equal(p.mod.length, 0);
  t.deepEqual(p.add[0], {prob: 0.25, value: 4.5});
  t.deepEqual(p.add[1], {prob: 0.5, value: 6.0});
  t.deepEqual(p.add[2], {prob: 0.75, value: 7.5});

  t.end();
});
