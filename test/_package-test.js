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
    },
    'unique': {
      'without transformation': {
        'should return all values of an array that contains only unique values in the same order': function (vg) {
          assert.deepEqual(vg.unique([1, 2, 3]), [1, 2, 3]);
        },
        'should filter out repeated occurrences of values': function (vg) {
          assert.deepEqual(vg.unique([1, 1, 2, 1, 2, 3, 1, 2, 3, 3, 3]), [1, 2, 3]);
        },
        'should treat undefined as a value and remove duplicates': function (vg) {
          assert.deepEqual(vg.unique([1, undefined, 2, undefined]), [1, undefined, 2]);
        }
      },
      'with transformation': {
        'should apply transformation to array elements': function (vg) {
          assert.deepEqual(vg.unique([1, 2, 3], function (d) {
            return -2 * d
          }), [-2, -4, -6]);
        },
        'should filter out repeated occurrences of transformed values': function (vg) {
          assert.deepEqual(vg.unique([1, 1, 2, 3], function (d) {
            return d < 3 ? 1 : 3;
          }), [1, 3]);
        }
      }
    }
  }
});

suite.export(module);