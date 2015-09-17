'use strict';

var assert = require('chai').assert;
var text = require('../src/util/text');
var DOM = require('../src/util/dom');

describe('util', function() {

  describe('text-font', function() {
    it('should produce default font string', function() {
      assert.equal(text.font({}), '11px sans-serif');
    });
    it('should include font style', function() {
      assert.equal(text.font({
        fontStyle: 'italic'
      }), 'italic 11px sans-serif');
    });
    it('should include font variant', function() {
      assert.equal(text.font({
        fontVariant: 'small-caps'
      }), 'small-caps 11px sans-serif');
    });
    it('should include font weight', function() {
      assert.equal(text.font({
        fontWeight: 'bold'
      }), 'bold 11px sans-serif');
    });
    it('should include font size', function() {
      assert.equal(text.font({
        fontSize: 18
      }), '18px sans-serif');
    });
    it('should include font family', function() {
      assert.equal(text.font({
        font: 'Helvetica'
      }), '11px Helvetica');
    });
    it('should include all properties style', function() {
      assert.equal(text.font({
        fontStyle: 'italic',
        fontVariant: 'small-caps',
        fontWeight: 'bold',
        fontSize: 18,
        font: 'Helvetica'
      }), 'italic small-caps bold 18px Helvetica');
    });
    it('should handle quotes if requested', function() {
      assert.equal(text.font({
        font: '"Helvetica Neue"'
      }, true), '11px \'Helvetica Neue\'');
      assert.equal(text.font({
        font: "'Helvetica Neue'"
      }, true), '11px \'Helvetica Neue\'');
    });
  });

  describe('dom', function() {
    it('should open tag', function() {
      assert.equal(DOM.openTag('g'), '<g>');
    });
    it('open tag should accept attributes', function() {
      assert.equal(DOM.openTag('g', {
        foo: '1',
        bar: null,
        baz: 'a',
      }), '<g foo="1" baz="a">');
    });
    it('open tag should accept raw extensions', function() {
      assert.equal(DOM.openTag('g', null, 'foo="1"'), '<g foo="1">');
    });
    it('should close tag', function() {
      assert.equal(DOM.closeTag('g'), '</g>');
    });
  });

});