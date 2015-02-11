var vows = require('vows'),
    assert = require('assert'),
    d3 = require('d3');

var suite = vows.describe('vg.marks');

suite.addBatch({
  'vg.marks': {
    topic: require('../index.js'),
    'single rect mark': {
      topic: function(vg) {
        var spec = {
          "data": [],
          "marks": [
            {
              "type": "rect",
              "properties": {
                "update": {
                  "x": { "value": 32 },
                  "y": { "value": 65 },
                  "x2": { "value": 153 },
                  "y2": { "value": 321 },
                }
              }
            }
          ]
        };
        return vg.headless.render({spec: spec, renderer: "svg"}, this.callback);
      },
      'geometry is as expected': function (err, result) {
        assert.isNull(err, "render error: " + err);
        assert.isNotNull(result, "no result");
        assert.isNotNull(result.svg, "no SVG in result");

        var rectMark = result.view.model().scene().items[0].items[0].items[0];
        assert.isNotNull(rectMark);
        assert.equal(rectMark.width, 121);
        assert.equal(rectMark.height, 256);
      },
    }
  }
});

suite.export(module);