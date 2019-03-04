var vega = require('../'), font = vega.font;

test('font should produce default font string', function() {
  expect(font({})).toBe('11px sans-serif');
});

test('font should include font style', function() {
  expect(font({
    fontStyle: 'italic'
  })).toBe('italic 11px sans-serif');
});

test('font should include font variant', function() {
  expect(font({
    fontVariant: 'small-caps'
  })).toBe('small-caps 11px sans-serif');
});

test('font should include font weight', function() {
  expect(font({
    fontWeight: 'bold'
  })).toBe('bold 11px sans-serif');
});

test('font should include font size', function() {
  expect(font({
    fontSize: 18
  })).toBe('18px sans-serif');
});

test('font should include font family', function() {
  expect(font({
    font: 'Helvetica'
  })).toBe('11px Helvetica');
});

test('font should include all properties style', function() {
  expect(font({
    fontStyle: 'italic',
    fontVariant: 'small-caps',
    fontWeight: 'bold',
    fontSize: 18,
    font: 'Helvetica'
  })).toBe('italic small-caps bold 18px Helvetica');
});

test('font should handle quotes if requested', function() {
  expect(font({
    font: '"Helvetica Neue"'
  }, true)).toBe('11px \'Helvetica Neue\'');
  expect(font({
    font: "'Helvetica Neue'"
  }, true)).toBe('11px \'Helvetica Neue\'');
});
