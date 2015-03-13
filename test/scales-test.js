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
        var axis = result.view.model().scene().items[0].axisItems[0];
        var textMark = axis.items[0].items[3].items[0];

        assert.isNotNull(textMark);
        assert.equal(textMark.text, "Key1");
      },
    },
    'discrete quantitative scales use appropriate domains': {
      topic: function(vg) {
        var values = [1, 3, 6, 7, 30, 50, 100, 120, 150, 500, 550, 1000];
        var spec = {
          "data": [
            {
              "name": "test",
              "format": {"type": "json" },
              "values": values
            }
          ],
          "scales": [
            { 
              "name": "s1",
              "type": "quantize",
              "domain": [0, 1000],
              "range": ["a", "b", "c", "d", "e"]
            },
            { 
              "name": "s2",
              "type": "quantize",
              "domain": {"data":"test", "field": "data"},
              "range": ["a", "b", "c", "d", "e"]
            },
            { 
              "name": "s3",
              "type": "quantile",
              "domain": [0, 1000],
              "range": ["a", "b", "c", "d", "e"]
            },
            { 
              "name": "s4",
              "type": "quantile",
              "domain": {"data":"test", "field": "data"},
              "range": ["a", "b", "c", "d", "e"]
            },
          ]
        };
        var cb = this.callback;
        return vg.parse.spec(spec, function(chart) {
          try {
            var view = chart().update();
            var scales = view._model._scene.items[0].scales;
            cb(null, scales);
          } catch (err) {
            cb(err, null);
          }
        }, vg.headless.View.Factory);
      },
      'quantize scale with fixed domain is correct': function (err, scales) {
        assert.isNull(err);
        assert.isNotNull(scales);
        var values = [1, 3, 6, 7, 30, 50, 100, 120, 150, 500, 550, 1000];
        var scaled = values.map(scales.s1);
        assert.deepEqual(["a","a","a","a","a","a","a","a","a","c","c","e"], scaled);
      },
      'quantize scale with data domain is correct': function (err, scales) {
        assert.isNull(err);
        assert.isNotNull(scales);
        var values = [1, 3, 6, 7, 30, 50, 100, 120, 150, 500, 550, 1000];
        var scaled = values.map(scales.s2);
        assert.deepEqual(["a","a","a","a","a","a","a","a","a","c","c","e"], scaled);
      },
      'quantile scale with fixed domain is correct': function (err, scales) {
        assert.isNull(err);
        assert.isNotNull(scales);
        var values = [1, 3, 6, 7, 30, 50, 100, 120, 150, 500, 550, 1000];
        var scaled = values.map(scales.s3);
        assert.deepEqual(["a","a","a","a","a","a","a","a","a","c","c","e"], scaled);
      },
      'quantile scale with data domain is correct': function (err, scales) {
        assert.isNull(err);
        assert.isNotNull(scales);
        var values = [1, 3, 6, 7, 30, 50, 100, 120, 150, 500, 550, 1000];
        var scaled = values.map(scales.s4);
        assert.deepEqual(["a","a","a","b","b","c","c","d","d","e","e","e"], scaled);
      }
    }
  }
});

suite.export(module);