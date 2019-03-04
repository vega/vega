var util = require('vega-util');
var vega = require('vega-dataflow');
var Collect = require('vega-transforms').collect;
var Wordcloud = require('../').wordcloud;

test('Wordcloud generates wordcloud layout', function() {
  var data = [
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

  var angles = [0, 30, 60, 90];
  rot.set(function(t) { return angles[t.index]; });

  df.pulse(c0, vega.changeset().insert(data)).run();
  expect(c0.value.length).toBe(data.length);
  expect(wc.stamp).toBe(df.stamp());

  for (var i=0, n=data.length; i<n; ++i) {
    expect(data[i].x != null && !isNaN(data[i].x)).toBeTruthy();
    expect(data[i].y != null && !isNaN(data[i].y)).toBeTruthy();
    expect(data[i].font).toBe('sans-serif');
    expect(data[i].fontSize).toBe(Math.sqrt(data[i].size));
    expect(data[i].fontStyle).toBe('normal');
    expect(data[i].fontWeight).toBe('normal');
    expect(data[i].angle).toBe(angles[i]);
  }
});
