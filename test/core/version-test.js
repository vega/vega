require("../env");

var vows = require("vows"),
    assert = require("assert");

var suite = vows.describe("vg.version");

suite.addBatch({
  "semantic versioning": {
    topic: vg.version,
    "has the form major.minor.patch": function(version) {
      assert.match(version, /^[1-9]+\.[0-9]+\.[0-9]+/);
    }
  }
});

suite.export(module);
