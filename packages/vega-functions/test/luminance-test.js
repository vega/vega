var tape = require('tape'),
    {luminance, contrast} = require('../').functionContext,
    {rgb} = require('d3-color');

tape('luminance calculation extremes', function(t) {
  t.equal(luminance(rgb("#000000")), 0);
  t.equal(luminance(rgb("#FFFFFF")), 1);
  t.end()
});

tape('contrast calculation extremes', function(t) {
  t.equal(contrast(rgb("black"), rgb("white")), 21);
  t.equal(contrast(rgb("black"), rgb("black")), 1);
  t.end()
});
