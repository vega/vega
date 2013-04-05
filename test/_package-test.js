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
    }
  }
});

suite.export(module);