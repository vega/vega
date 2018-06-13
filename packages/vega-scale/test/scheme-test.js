var tape = require('tape'),
    vega = require('../');

tape('scheme registers a single color scheme', function(test) {
  var name = 'rgb',
      colors = ['#f00', '#0f0', '#00f'];

  test.equal(vega.scheme(name), undefined);
  vega.scheme(name, colors);
  test.deepEqual(vega.scheme(name), colors);
  test.end();
});

tape('schemeDiscretized registers discretized color schemes', function(test) {
  var name = 'rgbd',
      colors = [
        ['#f00'],
        ['#f00', '#0f0'],
        ['#f00', '#0f0', '#00f']
      ];

  test.equal(vega.schemeDiscretized(name), undefined);
  vega.schemeDiscretized(name, colors);
  test.deepEqual(vega.schemeDiscretized(name), colors);
  test.equal(typeof vega.scheme(name), 'function');
  test.end();
});