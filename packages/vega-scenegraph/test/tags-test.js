var vega = require('../');
var openTag = vega.openTag;
var closeTag = vega.closeTag;

test('should open tag', function() {
  expect(openTag('g')).toBe('<g>');
});

test('open tag should accept attributes', function() {
  expect(openTag('g', {
    foo: '1',
    bar: null,
    baz: 'a'
  })).toBe('<g foo="1" baz="a">');
});

test('open tag should accept raw extensions', function() {
  expect(openTag('g', null, 'foo="1"')).toBe('<g foo="1">');
});

test('should close tag', function() {
  expect(closeTag('g')).toBe('</g>');
});
