var tape = require('tape'),
    vega = require('../'),
    font = vega.font;

tape('font should produce default font string', function(test) {
  test.equal(font({}), '11px sans-serif');
  test.end();
});

tape('font should include font style', function(test) {
  test.equal(font({
    fontStyle: 'italic'
  }), 'italic 11px sans-serif');
  test.end();
});

tape('font should include font variant', function(test) {
  test.equal(font({
    fontVariant: 'small-caps'
  }), 'small-caps 11px sans-serif');
  test.end();
});

tape('font should include font weight', function(test) {
  test.equal(font({
    fontWeight: 'bold'
  }), 'bold 11px sans-serif');
  test.end();
});

tape('font should include font size', function(test) {
  test.equal(font({
    fontSize: 18
  }), '18px sans-serif');
  test.end();
});

tape('font should include font family', function(test) {
  test.equal(font({
    font: 'Helvetica'
  }), '11px Helvetica');
  test.end();
});

tape('font should include all properties style', function(test) {
  test.equal(font({
    fontStyle: 'italic',
    fontVariant: 'small-caps',
    fontWeight: 'bold',
    fontSize: 18,
    font: 'Helvetica'
  }), 'italic small-caps bold 18px Helvetica');
  test.end();
});

tape('font should handle quotes if requested', function(test) {
  test.equal(font({
    font: '"Helvetica Neue"'
  }, true), '11px \'Helvetica Neue\'');
  test.equal(font({
    font: "'Helvetica Neue'"
  }, true), '11px \'Helvetica Neue\'');
  test.end();
});
