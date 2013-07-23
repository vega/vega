var vows = require('vows'),
    assert = require('assert'),
    d3 = require('d3');

var suite = vows.describe('vg.transforms');

function parseSpec(vg, cb, spec) {
    try {
      return vg.parse.spec(spec, function(chart) {
        try {
          var view = chart();
          assert.isNotNull(view, "no view");
          var data = view._model._data.table;
          assert.isNotNull(data, "no data");
          cb(null, data);
        } catch (err) {
          cb(err, null);
          assert.isNull(err, "error: " + err);
        }
      }, vg.headless.View.Factory);
    } catch (err) {
      cb(err, null);
      assert.isNull(err, "error: " + err);
    }
}

suite.addBatch({
  'vg.transforms': {
    topic: require('../index.js'),

    'arc transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [10,20,30],
              "transform": [
                {"type": "pie", "value": "data"}
              ]
            }
          ]
        });
      },

      'arc transform data': function (err, data) {

        assert.equal(data[0].startAngle, 0);
        assert.equal(data[0].endAngle, Math.PI/3);

        assert.equal(data[1].startAngle, Math.PI/3);
        assert.equal(data[1].endAngle, Math.PI);

        assert.equal(data[2].startAngle, Math.PI);
        assert.equal(data[2].endAngle, Math.PI*2);
      },
    },

    'array transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"a": 1, "b": 2, "c": 3},
                {"a": 4, "b": 5, "c": 6},
                {"a": 7, "b": 8, "c": 9},
              ],
              "transform": [
                {"type": "array", "fields": ["data.a", "data.c"]}
              ]
            }
          ]
        });
      },
      'array transform data': function (err, data) {
        assert.deepEqual(data, [[1,3],[4,6],[7,9]]);
      },
    },

    'copy transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"a": 1, "b": 2, "c": 3},
                {"a": 4, "b": 5, "c": 6},
                {"a": 7, "b": 8, "c": 9},
              ],
              "transform": [
                {
                  "type": "copy",
                  "from": "data",
                  "fields": ["a", "c"],
                  "as": ["a1", "c1"]
                }
              ]
            }
          ]
        });
      },
      'copy transform data': function (err, data) {
        assert.equal(data[0].a1, 1);
        assert.equal(data[0].c1, 3);
        assert.equal(data[1].a1, 4);
        assert.equal(data[1].c1, 6);
        assert.equal(data[2].a1, 7);
        assert.equal(data[2].c1, 9);
      },
    },

    'cross transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": ["x", "y", "z"],
              "transform": [
                {"type": "cross", "diagonal": false}
              ]
            }
          ]
        });
      },
      'cross transform data': function (err, data) {


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
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": ["x", "y", "z"],
              "transform": [
                {"type": "cross", "output": {"left": "l", "right": "r"}}
              ]
            }
          ]
        });
      },
      'cross transform with output data': function (err, data) {

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
    },

    'facet transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"a": 'x', "b": 2, "c": 3},
                {"a": 'x', "b": 4, "c": 5},
                {"a": 'y', "b": 6, "c": 7},
                {"a": 'y', "b": 8, "c": 9},
                {"a": 'z', "b": 10, "c": 11},
                {"a": 'z', "b": 12, "c": 13},
              ],
              "transform": [
                {
                  "type": "facet",
                  "keys": ["data.a"],
                }
              ]
            }
          ]
        });
      },
      'facet transform data': function (err, data) {

        assert.deepEqual(data['values'][0]['keys'], ['x']);
        assert.deepEqual(data['values'][0]['values'], [
            {"data":{"a":"x","b":2,"c":3},"index":0},
            {"data":{"a":"x","b":4,"c":5},"index":1}
            ]);

        assert.deepEqual(data['values'][1]['keys'], ['y']);
        assert.deepEqual(data['values'][1]['values'], [
            {"data":{"a":"y","b":6,"c":7},"index":2},
            {"data":{"a":"y","b":8,"c":9},"index":3}
            ]);

        assert.deepEqual(data['values'][2]['keys'], ['z']);
        assert.deepEqual(data['values'][2]['values'], [
            {"data":{"a":"z","b":10,"c":11},"index":4},
            {"data":{"a":"z","b":12,"c":13},"index":5}
            ]);
      },
    },

    'filter transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"a": 1, "b": 2, "c": 3},
                {"a": 4, "b": 5, "c": 6},
                {"a": 7, "b": 8, "c": 9},
              ],
              "transform": [
                {"type": "filter", "test": "d.data.a > 3 && d.data.c <= 7"}
              ]
            }
          ]
        });
      },
      'filter transform data': function (err, data) {
        assert.deepEqual(data, [{"data":{"a":4,"b":5,"c":6},"index":1}]);
      },
    },

    'flatten transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"a": 'x', "b": 2, "c": 3},
                {"a": 'x', "b": 4, "c": 5},
                {"a": 'y', "b": 6, "c": 7},
                {"a": 'y', "b": 8, "c": 9},
                {"a": 'z', "b": 10, "c": 11},
                {"a": 'z', "b": 12, "c": 13},
              ],
              "transform": [
                { "type": "facet", "keys": ["data.a"] },
                { "type": "flatten" }
              ]
            }
          ]
        });
      },
      'flatten transform data': function (err, data) {
        assert.deepEqual(data[0].data, { "a": 'x', "b": 2, "c": 3 });
        assert.deepEqual(data[1].data, { "a": 'x', "b": 4, "c": 5 });
        assert.deepEqual(data[2].data, { "a": 'y', "b": 6, "c": 7 });
        assert.deepEqual(data[3].data, { "a": 'y', "b": 8, "c": 9 });
        assert.deepEqual(data[4].data, { "a": 'z', "b": 10, "c": 11 });
        assert.deepEqual(data[5].data, { "a": 'z', "b": 12, "c": 13 });
      },
    },

    'fold transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"country": "USA", "gold":10, "silver":20}, 
                {"country": "Canada", "gold":7, "silver":26}
              ],
              "transform": [
                {"type": "fold", "fields": ["data.gold", "data.silver"]}
              ]
            }
          ]
        });
      },
      'fold transform data': function (err, data) {

        assert.equal(data[0]['key'], 'data.gold');
        assert.equal(data[0]['value'], 10);

        assert.equal(data[1]['key'], 'data.silver');
        assert.equal(data[1]['value'], 20);

        assert.equal(data[2]['key'], 'data.gold');
        assert.equal(data[2]['value'], 7);

        assert.equal(data[3]['key'], 'data.silver');
        assert.equal(data[3]['value'], 26);
      },
    },

    'formula transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"x": 1, "y": 2, "z": 3},
                {"x": 4, "y": 5, "z": 6},
                {"x": 7, "y": 8, "z": 9},
              ],
              "transform": [
                {
                  "type": "formula",
                  "field": "logx",
                  "expr": "log(d.data.x)/LN10"
                },
                {
                  "type": "formula",
                  "field": "xy",
                  "expr": "abs(d.data.x * d.data.y)"
                }
              ]
            }
          ]
        });
      },
      'formula transform data': function (err, data) {

        assert.equal(data[0]['logx'], 0);
        assert.equal(data[0]['xy'], 2);

        assert.equal(data[1]['logx'], 0.6020599913279623);
        assert.equal(data[1]['xy'], 20);

        assert.equal(data[2]['logx'], 0.8450980400142567);
        assert.equal(data[2]['xy'], 56);
      },
    },

    'slice by positive transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"a": 1, "b": 2, "c": 3},
                {"a": 4, "b": 5, "c": 6},
                {"a": 7, "b": 8, "c": 9},
              ],
              "transform": [
                {"type": "slice", "by": 2}
              ]
            }
          ]
        });
      },
      'slice by positive transform data': function (err, data) {
        assert.deepEqual(data, [{"data":{"a":7,"b":8,"c":9},"index":2}]);
      },
    },

    'slice by negative transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"a": 1, "b": 2, "c": 3},
                {"a": 4, "b": 5, "c": 6},
                {"a": 7, "b": 8, "c": 9},
              ],
              "transform": [
                {"type": "slice", "by": -1}
              ]
            }
          ]
        });
      },
      'slice by negative transform data': function (err, data) {
        assert.deepEqual(data, [{"data":{"a":7,"b":8,"c":9},"index":2}]);
      },
    },

    'slice by max transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"a": 1, "b": 2, "c": 3},
                {"a": 4, "b": 5, "c": 6},
                {"a": 7, "b": 8, "c": 9},
              ],
              "transform": [
                {"type": "slice", "by": "max", "field": "data.a"}
              ]
            }
          ]
        });
      },
      'slice by max transform data': function (err, data) {
        assert.deepEqual(data, [{"data":{"a":7,"b":8,"c":9},"index":2}]);
      },
    },

    'sort transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"a": 1, "b": 2, "c": 3},
                {"a": 1, "b": 5, "c": 6},
                {"a": 7, "b": 8, "c": 9},
              ],
              "transform": [
                {"type": "sort", "by": ["-data.a", "data.b", "-data.c"]}
              ]
            }
          ]
        });
      },
      'sort transform data': function (err, data) {
        assert.deepEqual(data, [ 
          { "data": { "a": 7, "b": 8, "c": 9 }, "index": 0 }, 
          { "data": { "a": 1, "b": 2, "c": 3 }, "index": 1 },
          { "data": { "a": 1, "b": 5, "c": 6 }, "index": 2 }, 
          ]);
      },
    },

    'stats transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"a": 1, "b": 2, "c": 3},
                {"a": 4, "b": 5, "c": 6},
                {"a": 7, "b": 8, "c": 9},
              ],
              "transform": [
                {"type": "stats", "value": "data.b", "median": "true"}
              ]
            }
          ]
        });
      },
      'stats transform data': function (err, data) {
        assert.deepEqual(data, [{
          "median": 5,
          "count": 3,
          "min": 2,
          "max": 8,
          "sum": 15,
          "mean": 5,
          "variance": 9,
          "stdev": 3
        }]);
      },
    },

    'truncate right transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"string": "The quick brown fox jumped over the lazy dog"}
              ],
              "transform": [
                {
                  "type": "truncate",
                  "value": "data.string",
                  "limit": 20,
                  "wordbreak": true
                }
              ]
            }
          ]
        });
      },
      'truncate right transform data': function (err, data) {
        assert.equal(data[0]['truncate'], "The quick brown...");
      },
    },

    'truncate middle transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"string": "The quick brown fox jumped over the lazy dog"}
              ],
              "transform": [
                {
                  "type": "truncate",
                  "value": "data.string",
                  "limit": 20,
                  "wordbreak": true,
                  "position": "middle"
                }
              ]
            }
          ]
        });
      },
      'truncate middle transform data': function (err, data) {
        assert.equal(data[0]['truncate'], "The quick...lazy dog");
      },
    },

    'truncate left transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"string": "The quick brown fox jumped over the lazy dog"}
              ],
              "transform": [
                {
                  "type": "truncate",
                  "value": "data.string",
                  "limit": 20,
                  "wordbreak": true,
                  "position": "left"
                }
              ]
            }
          ]
        });
      },
      'truncate left transform data': function (err, data) {
        assert.equal(data[0]['truncate'], "...over the lazy dog");
      },
    },

    'unique transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"a": 'x', "b": 2, "c": 3},
                {"a": 'y', "b": 5, "c": 6},
                {"a": 'x', "b": 8, "c": 9},
              ],
              "transform": [
                {"type": "unique", "field": "data.a", "as": "unq"}
              ]
            }
          ]
        });
      },
      'unique transform data': function (err, data) {
        assert.deepEqual(data, [ { "unq": 'x' }, { "unq": 'y' } ]);
      },
    },

    'window transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table",
              "values": [
                {"a": 1, "b": 2, "c": 3},
                {"a": 4, "b": 5, "c": 6},
                {"a": 7, "b": 8, "c": 9},
                {"a": 10, "b": 11, "c": 12},
                {"a": 13, "b": 14, "c": 15},
                {"a": 16, "b": 17, "c": 18},
              ],
              "transform": [
                {"type": "window", "size": 3, "step": 2}
              ]
            }
          ]
        });
      },
      'window transform data': function (err, data) {
        assert.deepEqual(data, { 
          values: [ 
            { 
              "key": 0, 
              "values": [ 
                { "data": { "a": 1, "b": 2, "c": 3 }, "index": 0 }, 
                { "data": { "a": 4, "b": 5, "c": 6 }, "index": 1 }, 
                { "data": { "a": 7, "b": 8, "c": 9 }, "index": 2 } 
              ] 
            }, 
            { 
              "key": 2, 
              "values": [ 
                { "data": { "a": 7, "b": 8, "c": 9 }, "index": 2 }, 
                { "data": { "a": 10, "b": 11, "c": 12 }, "index": 3 }, 
                { "data": { "a": 13, "b": 14, "c": 15 }, "index": 4 } 
              ] 
            } 
            ] 
          });
      },
    },

    'zip transform': {
      topic: function(vg) {
        return parseSpec(vg, this.callback, {
          "data": [
            {
              "name": "table1",
              "values": [
                {"a": 1, "b": 2, "c": 3},
                {"a": 4, "b": 5, "c": 6},
                {"a": 7, "b": 8, "c": 9},
              ]
            },
            {
              "name": "table",
              "values": [
                {"a": 1, "d": 11, "e": 12},
                {"a": 4, "d": 14, "e": 15},
                {"a": 7, "d": 17, "e": 18},
              ],
              "transform": [
                {
                "type": "zip",
                "key": "data.a",
                "with": "table1",
                "withKey": "data.a",
                "as": "zipped",
                "default": null
                }

              ]
            }
          ]
        });
      },
      'zip transform data': function (err, data) {
        assert.deepEqual(data, [ 
          { 
            "index": 0, 
            "data": { "a": 1, "d": 11, "e": 12 }, 
            "zipped": { "data": { "a": 1, "b": 2, "c": 3 }, "index": 0 } 
          }, 
          { 
            "index": 1, 
            "data": { "a": 4, "d": 14, "e": 15 }, 
            "zipped": { "data": { "a": 4, "b": 5, "c": 6 }, "index": 1 } 
          }, 
          { 
            "index": 2, 
            "data": { "a": 7, "d": 17, "e": 18 }, 
            "zipped": { "data": { "a": 7, "b": 8, "c": 9 }, "index": 2 } 
          } 
          ]);
        },
      },



    }
});

suite.export(module);
