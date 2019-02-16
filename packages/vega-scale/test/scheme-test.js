var tape = require('tape'),
    vega = require('../');

tape('scheme registers a single color scheme', function(t) {
  var name = 'rgb',
      colors = ['#f00', '#0f0', '#00f'];

  t.equal(vega.scheme(name), undefined);
  vega.scheme(name, colors);
  t.deepEqual(vega.scheme(name), colors);
  t.end();
});

tape('schemeDiscretized registers discretized color schemes', function(t) {
  var name = 'rgbd',
      colors = [
        ['#f00'],
        ['#f00', '#0f0'],
        ['#f00', '#0f0', '#00f']
      ];

  t.equal(vega.schemeDiscretized(name), undefined);
  vega.schemeDiscretized(name, colors);
  t.deepEqual(vega.schemeDiscretized(name), colors);
  t.equal(typeof vega.scheme(name), 'function');
  t.end();
});
