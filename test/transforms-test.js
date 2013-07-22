var vows = require('vows'),
    assert = require('assert'),
    d3 = require('d3');

var suite = vows.describe('vg.transforms');

suite.addBatch({
  'vg.transforms': {
    topic: require('../index.js'),
    'arc transform': {
      topic: function(vg) {
        var spec = {
          "data": [
            {
              "name": "table",
              "values": [10,20,30],
              "transform": [
                {"type": "pie", "value": "data"}
              ]
            }
          ]
        };

        var cb = this.callback;
        return vg.parse.spec(spec, function(chart) {
          try { cb(null, chart().update()); } catch (err) { cb(err, null); }
        }, vg.headless.View.Factory);
      },
      'arc transform data': function (err, view) {
        assert.isNull(err, "render error: " + err);

        var data = view._model._data.table;

        assert.isNotNull(data, "no data");

        assert.equal(data[0].startAngle, 0);
        assert.equal(data[0].endAngle, Math.PI/3);

        assert.equal(data[1].startAngle, Math.PI/3);
        assert.equal(data[1].endAngle, Math.PI);

        assert.equal(data[2].startAngle, Math.PI);
        assert.equal(data[2].endAngle, Math.PI*2);
      },
    },
    'cross transform': {
      topic: function(vg) {
        var spec = {
          "data": [
            {
              "name": "table",
              "values": ["x", "y", "z"],
              "transform": [
                {"type": "cross", "diagonal": false}
              ]
            }
          ]
        };

        var cb = this.callback;
        return vg.parse.spec(spec, function(chart) {
          try { cb(null, chart().update()); } catch (err) { cb(err, null); }
        }, vg.headless.View.Factory);
      },
      'cross transform data': function (err, view) {
        assert.isNull(err, "render error: " + err);

        var data = view._model._data.table;
        assert.isNotNull(data, "no data");

        assert.equal(data[0].a.data, "x");
        assert.equal(data[0].b.data, "y");

        assert.equal(data[1].a.data, "x");
        assert.equal(data[1].b.data, "z");

        assert.equal(data[2].a.data, "y");
        assert.equal(data[2].b.data, "x");

        assert.equal(data[3].a.data, "y");
        assert.equal(data[3].b.data, "z");

        assert.equal(data[4].a.data, "z");
        assert.equal(data[4].b.data, "x");

        assert.equal(data[5].a.data, "z");
        assert.equal(data[5].b.data, "y");
      },
    },
    'cross transform with output': {
      topic: function(vg) {
        var spec = {
          "data": [
            {
              "name": "table",
              "values": ["x", "y", "z"],
              "transform": [
                {"type": "cross", "output": {"left": "l", "right": "r"}}
              ]
            }
          ]
        };

        var cb = this.callback;
        try {
          return vg.parse.spec(spec, function(chart) {
            try { cb(null, chart().update()); } catch (err) { cb(err, null); }
          }, vg.headless.View.Factory);
        } catch (err) {
          cb(err, null);
        }
      },
      'cross transform with output data': function (err, view) {
        assert.isNull(err, "render error: " + err);
        assert.equal(typeof(view._model), "object");

        var data = view._model._data.table;

        assert.isNotNull(data, "no data");

        assert.equal(data[0].l.data, "x");
        assert.equal(data[0].r.data, "x");

        assert.equal(data[1].l.data, "x");
        assert.equal(data[1].r.data, "y");

        assert.equal(data[2].l.data, "x");
        assert.equal(data[2].r.data, "z");

        assert.equal(data[3].l.data, "y");
        assert.equal(data[3].r.data, "x");

        assert.equal(data[4].l.data, "y");
        assert.equal(data[4].r.data, "y");

        assert.equal(data[5].l.data, "y");
        assert.equal(data[5].r.data, "z");

        assert.equal(data[6].l.data, "z");
        assert.equal(data[6].r.data, "x");

        assert.equal(data[7].l.data, "z");
        assert.equal(data[7].r.data, "y");

        assert.equal(data[8].l.data, "z");
        assert.equal(data[8].r.data, "z");
      },
    }
  }
});

suite.export(module);