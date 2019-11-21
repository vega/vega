var tape = require('tape'),
    {luminance, contrast} = require('../');

tape('luminance calculation extremes', function(t) {
  t.equal(luminance('#000000'), 0);
  t.equal(luminance('#FFFFFF'), 1);
  t.end();
});

tape('contrast calculation extremes', function(t) {
  t.equal(contrast('black', 'white'), 21);
  t.equal(contrast('black', 'black'), 1);
  t.end();
});
