var vows = require('vows'),
    assert = require('assert'),
    fs = require('fs');

var suite = vows.describe('vg.headless.svg');
var dir = "test/data/";

suite.addBatch({
  'vg.headless.svg': {
    topic: require('../index.js'),
    'render svg': {
      topic: function(vg) {
        var spec = fs.readFileSync(dir + 'vg.headless.svg_test.json');
        return vg.headless.render(
          {
            spec: JSON.parse(spec),
            renderer: "svg"
          },
          this.callback);
      },
      'renders successfully': function(err, result) {
        assert.isNull(err, "render error: " + err);
        assert.isNotNull(result, "no result");
        assert.isNotNull(result.svg, "no SVG in result");
        
        var svg = fs.readFileSync(dir + 'vg.headless.svg_test.svg');
        assert.equal(svg, result.svg);
      },
    }
  }
});

suite.export(module);