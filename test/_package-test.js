var vows = require('vows'),
  assert = require('assert'),
  setup = require('./setup');

var suite = vows.describe('_package');

suite.addBatch({
  '_package': {
    topic: setup("_package").expression("vg"),
    'isNumber': {
      'isNumber(0) should be true': function (vg) {
        assert.equal(vg.isNumber(0), true);
      }
    },
    'array': {
      'array(null) should return an empty array': function (vg) {
        assert.deepEqual(vg.array(null), []);
      },
      'array(undefined) should return an empty array': function (vg) {
        assert.deepEqual(vg.array(), []);
      },
      'array(some array) should return the same array': function (vg) {
        var value = [1, 2, 3];
        assert.strictEqual(vg.array(value), value);
      },
      'array(one non-array argument) should return an array containing the argument': function (vg) {
        assert.deepEqual(vg.array(1), [1]);
      }
    }   }
});

suite.export(module);