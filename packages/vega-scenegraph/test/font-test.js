var tape = require('tape'),
    vega = require('../'),
    font = vega.font;

tape('font should produce default font string', function(t) {
  t.equal(font({}), '11px sans-serif');
  t.end();
});

tape('font should include font style', function(t) {
  t.equal(font({
    fontStyle: 'italic'
  }), 'italic 11px sans-serif');
  t.end();
});

tape('font should include font variant', function(t) {
  t.equal(font({
    fontVariant: 'small-caps'
  }), 'small-caps 11px sans-serif');
  t.end();
});

tape('font should include font weight', function(t) {
  t.equal(font({
    fontWeight: 'bold'
  }), 'bold 11px sans-serif');
  t.end();
});

tape('font should include font size', function(t) {
  t.equal(font({
    fontSize: 18
  }), '18px sans-serif');
  t.end();
});

tape('font should include font family', function(t) {
  t.equal(font({
    font: 'Helvetica'
  }), '11px Helvetica');
  t.end();
});

tape('font should include all properties style', function(t) {
  t.equal(font({
    fontStyle: 'italic',
    fontVariant: 'small-caps',
    fontWeight: 'bold',
    fontSize: 18,
    font: 'Helvetica'
  }), 'italic small-caps bold 18px Helvetica');
  t.end();
});

tape('font should handle quotes if requested', function(t) {
  t.equal(font({
    font: '"Helvetica Neue"'
  }, true), '11px \'Helvetica Neue\'');
  t.equal(font({
    font: "'Helvetica Neue'"
  }, true), '11px \'Helvetica Neue\'');
  t.end();
});
