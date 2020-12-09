var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    Collect = require('vega-transforms').collect,
    Wordcloud = require('../').wordcloud;

tape('Wordcloud generates wordcloud layout', t => {
  const data = [
    {text: 'foo', size: 49, index: 0},
    {text: 'bar', size: 36, index: 1},
    {text: 'baz', size: 25, index: 2},
    {text: 'abc', size:  1, index: 3}
  ];

  var text = util.field('text'),
      size = util.field('size'),
      df = new vega.Dataflow(),
      rot = df.add(null),
      c0 = df.add(Collect),
      wc = df.add(Wordcloud, {
        size: [500, 500],
        text: text,
        fontSize: size,
        fontSizeRange: [1, 7],
        rotate: rot,
        pulse: c0
      });

  const angles = [0, 30, 60, 90];
  rot.set(t => angles[t.index]);

  df.pulse(c0, vega.changeset().insert(data)).run();
  t.equal(c0.value.length, data.length);
  t.equal(wc.stamp, df.stamp());

  for (var i=0, n=data.length; i<n; ++i) {
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
