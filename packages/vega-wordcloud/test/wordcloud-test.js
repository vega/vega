const tape = require('tape');
const util = require('vega-util');
const vega = require('vega-dataflow');
const Collect = require('vega-transforms').collect;
const Wordcloud = require('../').wordcloud;

tape('Wordcloud generates wordcloud layout', function (t) {
  const data = [
    {text: 'foo', size: 49, index: 0},
    {text: 'bar', size: 36, index: 1},
    {text: 'baz', size: 25, index: 2},
    {text: 'abc', size: 1, index: 3}
  ];

  const text = util.field('text');
  const size = util.field('size');
  const df = new vega.Dataflow();
  const rot = df.add(null);
  const c0 = df.add(Collect);
  const wc = df.add(Wordcloud, {
    size: [500, 500],
    text: text,
    fontSize: size,
    fontSizeRange: [1, 7],
    rotate: rot,
    pulse: c0
  });

  const angles = [0, 30, 60, 90];
  rot.set(function (t) {
    return angles[t.index];
  });

  df.pulse(c0, vega.changeset().insert(data)).run();
  t.equal(c0.value.length, data.length);
  t.equal(wc.stamp, df.stamp());

  for (let i = 0, n = data.length; i < n; ++i) {
    t.ok(data[i].x != null && !Number.isNaN(data[i].x));
    t.ok(data[i].y != null && !Number.isNaN(data[i].y));
    t.equal(data[i].font, 'sans-serif');
    t.equal(data[i].fontSize, Math.sqrt(data[i].size));
    t.equal(data[i].fontStyle, 'normal');
    t.equal(data[i].fontWeight, 'normal');
    t.equal(data[i].angle, angles[i]);
  }

  t.end();
});
