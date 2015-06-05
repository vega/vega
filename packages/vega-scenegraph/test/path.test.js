'use strict';
var assert = require('chai').assert;

describe('path', function() {

  describe('parse', function() {
    var parse = require('../src/path/parse');
    it('should parse svg path', function() {
      var s1 = "M1,1L1,2";
      var s2 = "M 1 1 L 1 2";
      var s3 = "M 1,1 L 1 2";
      var p = [['M',1,1], ['L',1,2]];
      assert.deepEqual(parse(s1), p);
      assert.deepEqual(parse(s2), p);
      assert.deepEqual(parse(s3), p);
    });
    it('should handle repeated arguments', function() {
      var s = "M 1 1 L 1 2 3 4";
      var p = [['M',1,1], ['L',1,2], ['L',3,4]];
      assert.deepEqual(parse(s), p);
    });
    it('should skip NaN parameters', function() {
      var s = "M 1 1 L 1 x";
      var p = [['M',1,1], ['L',1]];
      assert.deepEqual(parse(s), p);
    });
  });

});