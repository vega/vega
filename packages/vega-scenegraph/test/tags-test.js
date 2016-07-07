var tape = require('tape'),
    vega = require('../'),
    openTag = vega.openTag,
    closeTag = vega.closeTag;

tape('should open tag', function(test) {
  test.equal(openTag('g'), '<g>');
  test.end();
});

tape('open tag should accept attributes', function(test) {
  test.equal(openTag('g', {
    foo: '1',
    bar: null,
    baz: 'a'
  }), '<g foo="1" baz="a">');
  test.end();
});

tape('open tag should accept raw extensions', function(test) {
  test.equal(openTag('g', null, 'foo="1"'), '<g foo="1">');
  test.end();
});

tape('should close tag', function(test) {
  test.equal(closeTag('g'), '</g>');
  test.end();
});