var vows = require('vows'),
  assert = require('assert'),
  setup = require('./setup');

var suite = vows.describe('_package');

suite.addBatch({
  '_package': {
    topic: setup("_package").expression("vg"),
    'isNumber': {
      '0 is a number': {
        topic: function (vg) {
          return vg.isNumber(0);
        },
        'should be true': function (topic) {
          assert.equal(topic, true);
        }
      }
    },
    'array': {
      'array called with null': {
        topic: function (vg) {
          return vg.array(null);
        },
        'should return an empty array': function (topic) {
          assert.deepEqual(topic, []);
        }
      },
      'array called without parameters)': {
        topic: function (vg) {
          return vg.array();
        },
        'should return an empty array': function (topic) {
          assert.deepEqual(topic, []);
        }
      },
      'array called with an array': {
        topic: function (vg) {
            return vg.array([1, 2, 3]);
        },
        'should return the same array': function (topic) {
          assert.deepEqual(topic, [1, 2, 3]);
        }
      },
      'array called with one non-array argument': {
        topic: function (vg) {
            return vg.array(1);
        },
        'should return an array containing the argument': function (topic) {
          assert.deepEqual(topic, [1]);
        }
      }
    }
  }
});

suite.export(module);