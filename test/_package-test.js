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
    },
    "keys": {
      "should enumerate every defined key": function (vg) {
        assert.deepEqual(vg.keys({a: 1, b: 1}), ["a", "b"]);
      },
      "should include keys defined on prototypes": function (vg) {
        function Abc() {
          this.a = 1;
          this.b = 2;
        }

        Abc.prototype.c = 3;
        assert.deepEqual(vg.keys(new Abc()), ["a", "b", "c"]);
      },
      "should include keys with null or undefined values": function (vg) {
        assert.deepEqual(vg.keys({a: undefined, b: null, c: NaN}), ["a", "b", "c"]);
      }
    },
    'values': {
      'should return "values" property of an object argument that has a "values" property': function (vg) {
        var testValues = [1];
        assert.strictEqual(vg.values({'values': testValues}), testValues);
      },
      'should return the argument itself if it is an object, but has no "values" property': function (vg) {
        var object = {};
        assert.strictEqual(vg.values(object), object);
      },
      'should return an array argument, even if it has a "values" property': function (vg) {
        var array = [];
        array.values = {};
        assert.strictEqual(vg.values(array), array);
      },
      'should return a number argument': function (vg) {
        assert.equal(vg.values(2.2), 2.2);
      }
    }
  }
});

suite.export(module);