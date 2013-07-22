var vows = require("vows"),
    assert = require("assert");

var suite = vows.describe("vg.version");

suite.addBatch({
  "semantic versioning": {
    topic: require('../index.js'),
    "has the form major.minor.patch": function(vg) {
      assert.match(vg.version, /^[1-9]+\.[0-9]+\.[0-9]+/);
    }
  }
});

suite.export(module);
