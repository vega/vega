var tape = require('tape'),
    vega = require('../'),
    openTag = vega.openTag,
    closeTag = vega.closeTag;

tape('should open tag', function(t) {
  t.equal(openTag('g'), '<g>');
  t.end();
});

tape('open tag should accept attributes', function(t) {
  t.equal(openTag('g', {
    foo: '1',
    bar: null,
    baz: 'a'
  }), '<g foo="1" baz="a">');
  t.end();
});

tape('open tag should accept raw extensions', function(t) {
  t.equal(openTag('g', null, 'foo="1"'), '<g foo="1">');
  t.end();
});

tape('should close tag', function(t) {
  t.equal(closeTag('g'), '</g>');
  t.end();
});
