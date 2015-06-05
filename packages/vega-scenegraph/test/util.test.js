'use strict';
var assert = require('chai').assert;

describe('util', function() {

  describe('font-string', function() {
    var fontString = require('../src/util/font-string');
    it('should produce default font string', function() {
      assert.equal(fontString({}), '11px sans-serif');
    });
    it('should include font style', function() {
      assert.equal(fontString({
        fontStyle: 'italic'
      }), 'italic 11px sans-serif');
    });
    it('should include font variant', function() {
      assert.equal(fontString({
        fontVariant: 'small-caps'
      }), 'small-caps 11px sans-serif');
    });
    it('should include font weight', function() {
      assert.equal(fontString({
        fontWeight: 'bold'
      }), 'bold 11px sans-serif');
    });
    it('should include font size', function() {
      assert.equal(fontString({
        fontSize: 18
      }), '18px sans-serif');
    });
    it('should include font family', function() {
      assert.equal(fontString({
        font: 'Helvetica'
      }), '11px Helvetica');
    });
    it('should include all properties style', function() {
      assert.equal(fontString({
        fontStyle: 'italic',
        fontVariant: 'small-caps',
        fontWeight: 'bold',
        fontSize: 18,
        font: 'Helvetica'
      }), 'italic small-caps bold 18px Helvetica');
    });
    it('should handle quotes if requested', function() {
      assert.equal(fontString({
        font: '"Helvetica Neue"'
      }, true), '11px \'Helvetica Neue\'');
      assert.equal(fontString({
        font: "'Helvetica Neue'"
      }, true), '11px \'Helvetica Neue\'');
    });
  });

  describe('xml', function() {
    var xml = require('../src/util/xml');
    it('should open tag', function() {
      assert.equal(xml.openTag('g'), '<g>');
    });
    it('open tag should accept attributes', function() {
      assert.equal(xml.openTag('g', {
        foo: '1',
        bar: null,
        baz: 'a',
      }), '<g foo="1" baz="a">');
    });
    it('open tag accept raw extensions', function() {
      assert.equal(xml.openTag('g', null, 'foo="1"'), '<g foo="1">');
    });
    it('should close tag', function() {
      assert.equal(xml.closeTag('g'), '</g>');
    });
  });

});