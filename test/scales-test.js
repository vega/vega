var vows = require('vows'),
    assert = require('assert'),
    d3 = require('d3');

var suite = vows.describe('vg.scales');

suite.addBatch({
  'vg.scales': {
    topic: require('../index.js'),
    'ordinal scales allow data referenced ranges': {
      topic: function(vg) {
        var spec = {
          "data": [
              {
                  "name": "test",
                  "format": {"type": "json" },
                  "values": [
                    {"key":1,"label":"Key1","value":1.0},
                    {"key":2,"label":"Key2","value":4.0},
                    {"key":3,"label":"Key3","value":3.0},
                    {"key":4,"label":"Key4","value":6.0}
                  ]
            }
          ],
          "scales": [
            { 
              "name": "labels",
              "type": "ordinal",
              "domain": {"data":"test", "field": "data.key" },
              "range": {"data":"test", "field": "data.label" }
            },
            {
              "name":"x","type":"ordinal","range":"width",
              "domain":{"data":"test","field":"data.key"}
            },
            { 
              "name":"y", "type":"linear","range":"height",
              "domain":{"data":"test","field":"data.value"}
            }
          ],
          "axes": [
            {
              "type": "x", "scale": "labels", 
              "properties": {
                "labels" : { "text": {"scale": "labels", "field": "data"} }
              }
            }
          ],
          "marks": [
            {
              "type": "rect",
              "from": {"data":"test" },
              "properties": {
                "enter": {
                  "x": { "scale":"x", "field": "data.key" },
                  "width": {"scale": "x", "band": true, "offset": -1 },
                  "y": { "scale":"y","field": "data.value" },
                  "y2": { "value": 0 }
                }
              }
            }
          ]
        };
        return vg.headless.render({spec: spec, renderer: "svg"}, this.callback);
      },
      'syntax is accepted': function (err, result) {
        assert.isNull(err, "render error: " + err);
        assert.isNotNull(result, "no result");
        assert.isNotNull(result.svg, "no SVG in result");
      },
      'axis is correctly labelled': function (err, result) {
        // should retrieve the first text item of axis x
        var textMark = d3.select('svg').select('text').node();

        assert.isNotNull(textMark);
        assert.equal(textMark.firstChild.nodeValue, "Key1");
      },
    }
  }
});

suite.export(module);