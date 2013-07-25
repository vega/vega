var vows = require('vows'),
    assert = require('assert'),
    d3 = require('d3');

var suite = vows.describe('vg.groups');

suite.addBatch({
  'vg.groups': {
    topic: require('../index.js'),
    'group data lookup': {
      topic: function(vg) {
        var spec = {
          "data": [
            {
              "name": "coordinates",
              "values": [
                { "p1": 1, "p2": 1, "p3": 10, "p4": 10 },
                { "p1": 2, "p2": 4, "p3": 15, "p4": 16 },
                { "p1": 3, "p2": 9, "p3": 89, "p4": 91 },
              ]
            },
            {
              "name": "geometries",
              "values": [
                {"xfield":"p1", "yfield":"p2", "x2field":"p3", "y2field":"p4"},
                {"xfield":"p2", "yfield":"p1", "x2field":"p4", "y2field":"p3"},
              ]
            }
          ],
          "marks": [
            {
              "type": "group",
              "from": { "data": "geometries" },
              "marks": [
                {
                  "type": "rect",
                  "from": { "data": "coordinates" },
                  "properties": {
                    "update": {
                      "x": { "field": { "group": "data.xfield" } },
                      "y": { "field": { "group": "data.yfield" } },
                      "x2": { "field": { "group": "data.x2field" } },
                      "y2": { "field": { "group": "data.y2field" } },
                    }
                  }
                }
              ]
            }
          ]
        };
        return vg.headless.render({spec: spec, renderer: "svg"}, this.callback);
      },
      'group lookup': function (err, result) {
        if (err) throw err;
        assert.isNull(err, "render error: " + err);
        assert.isNotNull(result, "no result");
        assert.isNotNull(result.svg, "no SVG in result");

        var marks = d3.select('svg').
          selectAll('rect:not([class="background"])')[0];

        assert.lengthOf(marks, 6);

        // first group
        assert.equal(parseInt(marks[0].getAttribute("x")), 1);
        assert.equal(parseInt(marks[0].getAttribute("y")), 1);
        assert.equal(parseInt(marks[0].getAttribute("width")), 10-1);
        assert.equal(parseInt(marks[0].getAttribute("height")), 10-1);

        assert.equal(parseInt(marks[1].getAttribute("x")), 2);
        assert.equal(parseInt(marks[1].getAttribute("y")), 4);
        assert.equal(parseInt(marks[1].getAttribute("width")), 15-2);
        assert.equal(parseInt(marks[1].getAttribute("height")), 16-4);

        assert.equal(parseInt(marks[2].getAttribute("x")), 3);
        assert.equal(parseInt(marks[2].getAttribute("y")), 9);
        assert.equal(parseInt(marks[2].getAttribute("width")), 89-3);
        assert.equal(parseInt(marks[2].getAttribute("height")), 91-9);

        // second group
        assert.equal(parseInt(marks[3].getAttribute("y")), 1);
        assert.equal(parseInt(marks[3].getAttribute("x")), 1);
        assert.equal(parseInt(marks[3].getAttribute("height")), 10-1);
        assert.equal(parseInt(marks[3].getAttribute("width")), 10-1);

        assert.equal(parseInt(marks[4].getAttribute("y")), 2);
        assert.equal(parseInt(marks[4].getAttribute("x")), 4);
        assert.equal(parseInt(marks[4].getAttribute("height")), 15-2);
        assert.equal(parseInt(marks[4].getAttribute("width")), 16-4);

        assert.equal(parseInt(marks[5].getAttribute("y")), 3);
        assert.equal(parseInt(marks[5].getAttribute("x")), 9);
        assert.equal(parseInt(marks[5].getAttribute("height")), 89-3);
        assert.equal(parseInt(marks[5].getAttribute("width")), 91-9);
      },
    }
  }
});

suite.export(module);
