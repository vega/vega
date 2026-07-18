import tape from 'tape';
import { field } from 'vega-util';
import { Dataflow, changeset } from 'vega-dataflow';
import { collect as Collect } from 'vega-transforms';
import { wordcloud as Wordcloud } from '../index.js';

tape('Wordcloud generates wordcloud layout', t => {
  const data = [
    {text: 'foo', size: 49, index: 0},
    {text: 'bar', size: 36, index: 1},
    {text: 'baz', size: 25, index: 2},
    {text: 'abc', size:  1, index: 3}
  ];

  var text = field('text'),
      size = field('size'),
      df = new Dataflow(),
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

  df.pulse(c0, changeset().insert(data)).run();
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
