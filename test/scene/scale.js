var config = require('../../src/util/config');
var range = [10, 120];

describe('Scale', function() {
  describe('Domain', function() {
    it('should support hardcoded values', function(done) {
      var ord = ["US", "Canada", "Mexico"],
          lin = [0, 1, 2, 3, 4, 5];

      var spec = {
        "data": [],
        "scales": [
          {"name": "x", "type": "ordinal", "domain": ord, "range": [0, 1]},
          {"name": "y", "type": "linear", "domain": lin, "range": [0, 1]}
        ]
      };

      parseSpec(spec, function(model) {
        var group = model.scene().items[0],
            x = group.scale('x'),
            y = group.scale('y');

        expect(x.domain()).to.eql(ord);
        expect(y.domain()).to.eql(lin);

        done();
      }, viewFactory);
    });

    it('should support array<signal>', function(done) {
      var spec = {
        "signals": [{"name": "s1", "init": 5}, {"name": "s2", "init": 7}],
        "data": [],
        "scales": [
          {
            "name": "x", "type": "ordinal", 
            "domain": [1, 2, {"signal": "s1"}, 6, {"signal": "s2"}], 
            "range": [0, 1]
          }
        ]
      };

      parseSpec(spec, function(model) {
        var group = model.scene().items[0],
            x = group.scale('x');

        expect(x.domain()).to.eql([1, 2, 5, 6, 7]);

        model.signal('s1').value(3).fire();
        expect(x.domain()).to.eql([1, 2, 3, 6, 7]);

        model.signal('s2').value(6).fire();
        expect(x.domain()).to.eql([1, 2, 3, 6]);

        done();
      }, viewFactory);
    });

    describe('Min/Max', function() {
      it('should support hardcoded values', function(done) {
        var spec = {
          "data": [],
          "scales": [
            {"name": "y", "type": "linear", "domainMin": 0, "domainMax": 10, "range": [0, 1]}
          ]
        };

        parseSpec(spec, function(model) {
          var group = model.scene().items[0],
              y = group.scale('y');

          expect(y.domain()).to.eql([0, 10]);

          done();
        }, viewFactory);
      });

      it('should support signal values', function(done) {
        var spec = {
          "data": [],
          "signals": [
            {"name": "min", "init": 0},
            {"name": "max", "init": 10}
          ],

          "scales": [{
            "name": "y", "type": "linear", "range": [0, 1], "zero": false,
            "domainMin": {"signal": "min"}, 
            "domainMax": {"signal": "max"} 
          }]
        };

        parseSpec(spec, function(model) {
          var group = model.scene().items[0],
              y = group.scale('y');

          expect(y.domain()).to.eql([0, 10]);

          model.signal('min').value(5).fire();
          expect(y.domain()).to.eql([5, 10]);

          model.signal('max').value(15).fire();
          expect(y.domain()).to.eql([5, 15]);

          done();
        }, viewFactory);
      });

      it('should override domain values', function(done) {
        var spec = {
          "data": [],
          "scales": [{
            "name": "y", "type": "linear", "range": [0, 1],
            "domain": [5, 15],
            "domainMin": 0, "domainMax": 10
          }]
        };

        parseSpec(spec, function(model) {
          var group = model.scene().items[0],
              y = group.scale('y');

          expect(y.domain()).to.eql([0, 10]);

          done();
        }, viewFactory);
      });

      it('should support DataRef');
    });

    describe('DataRef', function() {
      describe('Data/Field Def', function() {
        var spec = {
          "data": [{
            "name": "table",
            "values": [
              {"x": 1,  "y": 28}, {"x": 2,  "y": 55},
              {"x": 3,  "y": 43}, {"x": 4,  "y": 91},
              {"x": 5,  "y": 81}, {"x": 6,  "y": 53},
              {"x": 7,  "y": 19}, {"x": 8,  "y": 87},
              {"x": 9,  "y": 52}, {"x": 10, "y": 48},
              {"x": 11, "y": 24}, {"x": 12, "y": 49},
              {"x": 13, "y": 87}, {"x": 14, "y": 66},
              {"x": 15, "y": 17}, {"x": 16, "y": 27},
              {"x": 17, "y": 68}, {"x": 18, "y": 16},
              {"x": 19, "y": 49}, {"x": 20, "y": 15}
            ]
          }],

          "scales": [
            {
              "name": "x",
              "type": "ordinal",
              "range": "width",
              "domain": {"data": "table", "field": "x"}
            },
            {
              "name": "y",
              "type": "linear",
              "range": "height", "zero": false,
              "domain": {"data": "table", "field": "y"}
            }
          ],
        };

        it('should initialize', function(done) {
          parseSpec(spec, function(model) {
            var group = model.scene().items[0],
                x = group.scale('x'),
                y = group.scale('y'),
                ord = [],
                i = 1, len = 20;

            for(; i<=len; ++i) ord.push(i+"");

            expect(x.domain()).to.have.members(ord);
            expect(y.domain()).to.eql([15, 91]);

            done();
          }, viewFactory);
        });

        it('should handle streaming adds', function(done) {
          parseSpec(spec, function(model) {
            model.data('table').add([
              {"x": 21, "y": 100}, {"x": 22, "y": 10},
              {"x": 23, "y": 53}
            ]).fire();

            var group = model.scene().items[0],
                x = group.scale('x'),
                y = group.scale('y'),
                ord = [],
                i = 1, len = 23;

            for(; i<=len; ++i) ord.push(i+"");

            expect(x.domain()).to.have.members(ord);
            expect(y.domain()).to.eql([10, 100]);

            done();
          }, viewFactory);
        });

        it('should handle streaming mods', function(done) {
          parseSpec(spec, function(model) {
            model.data('table')
              .update(function(x) { return x.x % 2 !== 0 }, "x", 
                function(x) { return x.x * 2 })
              .update(function(x) { return x.x >= 0 }, "y",
                function(x) { return x.y * 2 })
              .fire();

            var group = model.scene().items[0],
                x = group.scale('x'),
                y = group.scale('y'),
                ord = [],
                i = 1, len = 20, v;

            for(; i<=len; ++i) {
              v = i%2 ? i*2 : i;
              if(ord.indexOf(v+"") === -1) ord.push(v+"");
            }

            expect(x.domain()).to.have.members(ord);
            expect(y.domain()).to.eql([30, 182]);

            done();
          }, viewFactory);
        });

        it('should handle streaming rems', function(done) {
          parseSpec(spec, function(model) {
            model.data('table')
              .remove(function(x) { return x.x > 10 })
              .fire();

            var group = model.scene().items[0],
                x = group.scale('x'),
                y = group.scale('y'),
                ord = [],
                i = 1, len = 10;

            for(; i<=len; ++i) ord.push(i+"");

            expect(x.domain()).to.have.members(ord);
            expect(y.domain()).to.eql([19, 91]);

            done();
          }, viewFactory);
        });
      });

      describe('Fields Def', function() {
        var spec = {
          "data": [{
            "name": "table1",
            "values": [
              {"x": 1,  "y": 28}, {"x": 2,  "y": 55},
              {"x": 3,  "y": 43}, {"x": 4,  "y": 91},
              {"x": 5,  "y": 81}, {"x": 6,  "y": 53},
              {"x": 7,  "y": 19}, {"x": 8,  "y": 87},
              {"x": 9,  "y": 52}, {"x": 10, "y": 48}
          ]}, {
            "name": "table2",
            "values": [
              {"a": 11, "b": 24}, {"a": 12, "b": 49},
              {"a": 13, "b": 87}, {"a": 14, "b": 66},
              {"a": 15, "b": 17}, {"a": 16, "b": 27},
              {"a": 17, "b": 68}, {"a": 18, "b": 16},
              {"a": 19, "b": 49}, {"a": 20, "b": 15}
            ]
          }],

          "scales": [
            {
              "name": "x",
              "type": "ordinal",
              "range": "width",
              "domain": {"fields": [
                {"data": "table1", "field": "x"},
                {"data": "table2", "field": "a"}
              ]}
            },
            {
              "name": "y",
              "type": "linear",
              "range": "height", "zero": false,
              "domain": {"fields": [
                {"data": "table1", "field": "y"},
                {"data": "table2", "field": "b"}
              ]}
            }
          ]
        };

        it('should initialize', function(done) {
          parseSpec(spec, function(model) {
            var group = model.scene().items[0],
                x = group.scale('x'),
                y = group.scale('y'),
                ord = [],
                i = 0, len = 20;

            for(; i<len; ++i) ord.push((i+1)+"");

            expect(x.domain()).to.have.members(ord);
            expect(y.domain()).to.eql([15, 91]);

            done();
          }, viewFactory);
        });

        it('should handle streaming adds', function(done) {
          parseSpec(spec, function(model) {
            var group = model.scene().items[0],
                x = group.scale('x'),
                y = group.scale('y'),
                ord = [],
                i = 0, len = 20;

            for(; i<len; ++i) ord.push((i+1)+"");

            expect(x.domain()).to.have.members(ord);
            expect(y.domain()).to.eql([15, 91]);

            model.data('table1').add([
              {"x": 21, "y": 100}, {"x": 22, "y": 10},
              {"x": 23, "y": 53}
            ]).fire();
            ord.push("21", "22", "23");

            expect(x.domain()).to.have.members(ord);
            expect(y.domain()).to.eql([10, 100]);

            model.data('table2').add([
              {"a": 24, "b": 500}, {"a": 25, "b": 1},
              {"a": 26, "b": 523}
            ]).fire();
            ord.push("24", "25", "26");

            expect(x.domain()).to.have.members(ord);
            expect(y.domain()).to.eql([1, 523]);

            done();
          }, viewFactory);
        });

        it('should handle streaming mods', function(done) {
          parseSpec(spec, function(model) {
            var group = model.scene().items[0],
                x = group.scale('x'),
                y = group.scale('y'),
                ord = [],
                i = 1, len = 20, v;

            model.data('table1')
              .update(function(x) { return x.x % 2 !== 0 }, "x", 
                function(x) { return x.x * 2 })
              .update(function(x) { return x.x >= 0 }, "y",
                function(x) { return x.y * 2 })
              .fire();

            model.data('table2')
              .update(function(x) { return x.a % 2 !== 0 }, "a", 
                function(x) { return x.a * 2 })
              .update(function(x) { return x.b >= 0 }, "b",
                function(x) { return x.b * 2 })
              .fire();

            for(; i<=len; ++i) {
              v = i%2 ? i*2 : i;
              if(ord.indexOf(v+"") === -1) ord.push(v+"");
            }

            expect(x.domain()).to.have.members(ord);
            expect(y.domain()).to.eql([30, 182]);

            done();
          }, viewFactory);
        });

        it('should handle streaming rems', function(done) {
          parseSpec(spec, function(model) {
            model.data('table1')
              .remove(function(x) { return x.x > 10 })
              .fire();

            model.data('table2')
              .remove(function(x) { return x.a > 10 })
              .fire();

            var group = model.scene().items[0],
                x = group.scale('x'),
                y = group.scale('y'),
                ord = [],
                i = 1, len = 10;

            for(; i<=len; ++i) ord.push(i+"");

            expect(x.domain()).to.have.members(ord);
            expect(y.domain()).to.eql([19, 91]);

            done();
          }, viewFactory);
        });
      });

      describe('Group Field Def', function() {
        it('should initialize');
        it('should handle streaming adds');
        it('should handle streaming mods');
        it('should handle streaming rems');
      })

      describe('Inherit Group', function() {
        var spec = {
          "data": [{
            "name": "table",
            "values": [
              {"category":"A", "position":0, "value":0.1},
              {"category":"A", "position":1, "value":0.6},
              {"category":"A", "position":2, "value":0.9},
              {"category":"A", "position":3, "value":0.4},
              {"category":"B", "position":4, "value":0.7},
              {"category":"B", "position":5, "value":0.2},
              {"category":"B", "position":6, "value":1.1},
              {"category":"B", "position":7, "value":0.8},
              {"category":"C", "position":8, "value":0.6},
              {"category":"C", "position":9, "value":0.1},
              {"category":"C", "position":10, "value":0.2},
              {"category":"C", "position":11, "value":0.7}
            ],
            "transform": [{"type": "facet", "keys": ["category"] }]
          }],

          "marks": [{
            "type": "group",
            "from": {"data": "table"},
            "scales": [{
              "name": "pos",
              "type": "ordinal",
              "domain": {"field": "position"}
            }],
            "marks": []
          }]
        };

        it('should initialize', function(done) {
          parseSpec(spec, function(model) {
            var groups = model.scene().items[0].items[0].items,
                i = 0, len = groups.length,
                num = 4,
                group, pos, ord;

            for(; i<len; ++i) {
              pos = groups[i].scale('pos');
              ord = [num*i, num*i+1, num*i+2, num*i+3].map(function(v) { return v+"" });
              expect(pos.domain()).to.have.members(ord);
            }

            done();
          }, viewFactory);
        });

        it('should handle streaming adds', function(done) {
          parseSpec(spec, function(model) {
            model.data('table')
              .add([
                {"category": "A", "position": 4},
                {"category": "B", "position": 8},
                {"category": "C", "position": 12}
              ])
              .fire();

            var groups = model.scene().items[0].items[0].items,
                i = 0, len = groups.length,
                num = 4,
                group, pos, ord;

            for(; i<len; ++i) {
              pos = groups[i].scale('pos');
              ord = [num*i, num*i+1, num*i+2, num*i+3, num*i+4].map(function(v) { return v+"" });
              expect(pos.domain()).to.have.members(ord);
            }

            done();
          }, viewFactory);
        });

        it('should handle streaming mods', function(done) {
          parseSpec(spec, function(model) {
            model.data('table')
              .update(function(x) { return true }, "position", 
                function(x) { return x.position*2 })
              .fire();

            var groups = model.scene().items[0].items[0].items,
                i = 0, len = groups.length,
                num = 4,
                group, pos, ord;

            for(; i<len; ++i) {
              pos = groups[i].scale('pos');
              ord = [(num*i)*2, (num*i+1)*2, (num*i+2)*2, (num*i+3)*2].map(function(v) { return v+"" });
              expect(pos.domain()).to.have.members(ord);
            }

            done();
          }, viewFactory);
        });

        it('should handle streaming rems', function(done) {
          parseSpec(spec, function(model) {
            model.data('table')
              .remove(function(x) { return x.position % 2 === 0 })
              .fire();

            var groups = model.scene().items[0].items[0].items,
                i = 0, len = groups.length,
                num = 4,
                group, pos;

            for(; i<len; ++i) {
              pos = groups[i].scale('pos');
              expect(pos.domain()).to.have.members([num*i+1, num*i+3].map(function(v) { return v+""}));
            }

            done();
          }, viewFactory);
        });
      });
    }); 
  });

  describe('Range', function() {
    it('should support hardcoded values', function(done) {
      var spec = {
        "data": [],
        "scales": [{
          "name": "x", "type": "ordinal", 
          "domain": [0, 1], 
          "range": range
        }, {
          "name": "y", "type": "linear", 
          "domain": [0, 1], 
          "range": range
        }]
      };

      parseSpec(spec, function(model) {
        var group = model.scene().items[0],
            x = group.scale('x'),
            y = group.scale('y');

        expect(x.rangeBand()).to.eql((range[1]-range[0])/2);
        expect(x.rangeExtent()).to.eql(range);
        expect(y.range()).to.eql(range);

        done();
      }, viewFactory);
    });

    it('should support array<signal>', function(done) {
      var spec = {
        "signals": [{"name": "s1", "init": 5}, {"name": "s2", "init": 7}],
        "data": [],
        "scales": [{
          "name": "x", "type": "ordinal", 
          "domain": [0, 1], 
          "range": [{"signal": "s1"}, 23, {"signal": "s2"}, 51]
        }, {
          "name": "y", "type": "linear", 
          "domain": [0, 1], 
          "range": [{"signal": "s1"}, 23, {"signal": "s2"}, 51]
        }]
      };

      parseSpec(spec, function(model) {
        var group = model.scene().items[0],
            x = group.scale('x'),
            y = group.scale('y');

        expect(x.range()).to.eql([5, 23, 7, 51]);
        expect(y.range()).to.eql([5, 23, 7, 51]);

        model.signal('s1').value(10).fire();
        expect(x.range()).to.eql([10, 23, 7, 51]);
        expect(y.range()).to.eql([10, 23, 7, 51]);

        model.signal('s2').value(37).fire();
        expect(x.range()).to.eql([10, 23, 37, 51]);
        expect(y.range()).to.eql([10, 23, 37, 51]);

        done();
      }, viewFactory);
    });

    it('should reverse', function(done) {
      var spec = {
        "data": [],
        "scales": [{
          "name": "x", "type": "ordinal", 
          "domain": [0, 1], 
          "range": range, "reverse": true
        }, {
          "name": "y", "type": "linear", 
          "domain": [0, 1], 
          "range": range, "reverse": true
        }]
      };

      parseSpec(spec, function(model) {
        var group = model.scene().items[0],
            x = group.scale('x'),
            y = group.scale('y');

        expect(x.rangeBand()).to.eql((range[1]-range[0])/2);
        expect(x.range()).to.eql([range[1]-x.rangeBand(), range[0]]);
        expect(y.range()).to.eql([range[1], range[0]]);

        done();
      }, viewFactory);
    });

    it('should round');

    describe('Literals', function() {
      function spec(range) {
        return {
          "width": 500,
          "height": 300,
          "data": [],
          "scales": [{
            "name": "lin",
            "type": "linear",
            "domain": [0, 1],
            "range": range
          }, {
            "name": "ord",
            "type": "ordinal",
            "domain": [0, 1],
            "range": range
          }]
        };
      }

      it('should support `width`', function(done) {
        parseSpec(spec('width'), function(model) {
          var group = model.scene().items[0],
              linear  = group.scale('lin'),
              ordinal = group.scale('ord');

          expect(linear.range()).to.eql([0, 500]);
          expect(ordinal.range()).to.eql([0, 250]);

          done();
        }, viewFactory);
      });

      it('should support `height`', function(done) {
        parseSpec(spec('height'), function(model) {
          var group = model.scene().items[0],
              linear  = group.scale('lin'),
              ordinal = group.scale('ord');

          expect(linear.range()).to.eql([300, 0]);
          expect(ordinal.range()).to.eql([0, 150]);

          done();
        }, viewFactory);
      });

      it('should support `shapes`', function(done) {
        parseSpec(spec('shapes'), function(model) {
          var group = model.scene().items[0],
              linear  = group.scale('lin'),
              ordinal = group.scale('ord');

          expect(linear.range()).to.eql(config.range.shapes);
          expect(ordinal.range()).to.eql(config.range.shapes);

          done();
        }, viewFactory);
      });

      it('should support `category10`', function(done) {
        parseSpec(spec('category10'), function(model) {
          var group = model.scene().items[0],
              linear  = group.scale('lin'),
              ordinal = group.scale('ord');

          expect(linear.range()).to.eql(config.range.category10);
          expect(ordinal.range()).to.eql(config.range.category10);

          done();
        }, viewFactory);
      });

      it('should support `category20`', function(done) {
        parseSpec(spec('category20'), function(model) {
          var group = model.scene().items[0],
              linear  = group.scale('lin'),
              ordinal = group.scale('ord');

          expect(linear.range()).to.eql(config.range.category20);
          expect(ordinal.range()).to.eql(config.range.category20);

          done();
        }, viewFactory);
      });
    });

    describe('Min/Max', function() {
      it('should support hardcoded values', function(done) {
        var spec = {
          "data": [],
          "scales": [{
            "name": "x", "type": "ordinal", 
            "domain": [0, 1], 
            "rangeMin": range[0], "rangeMax": range[1]
          }, {
            "name": "y", "type": "linear", 
            "domain": [0, 1], 
            "rangeMin": range[0], "rangeMax": range[1]
          }]
        };

        parseSpec(spec, function(model) {
          var group = model.scene().items[0],
              x = group.scale('x'),
              y = group.scale('y');

          expect(x.rangeBand()).to.eql((range[1]-range[0])/2);
          expect(x.rangeExtent()).to.eql(range);
          expect(y.range()).to.eql(range);

          done();
        }, viewFactory);
      });

      it('should support signal values', function(done) {
        var spec = {
          "data": [],
          "signals": [
            {"name": "min", "init": range[0]},
            {"name": "max", "init": range[1]}
          ],

          "scales": [{
            "name": "x", "type": "ordinal", 
            "domain": [0, 1], 
            "rangeMin": {"signal": "min"}, "rangeMax": {"signal": "max"}
          }, {
            "name": "y", "type": "linear", 
            "domain": [0, 1], 
            "rangeMin": {"signal": "min"}, "rangeMax": {"signal": "max"}
          }]
        };

        parseSpec(spec, function(model) {
          var group = model.scene().items[0],
              x = group.scale('x'),
              y = group.scale('y');

          expect(x.rangeBand()).to.eql((range[1]-range[0])/2);
          expect(x.rangeExtent()).to.eql(range);
          expect(y.range()).to.eql(range);

          model.signal('min').value(27).fire();
          expect(x.rangeBand()).to.eql(~~((range[1]-27)/2));
          expect(x.rangeExtent()).to.eql([27, range[1]]);
          expect(y.range()).to.eql([27, range[1]]);

          model.signal('max').value(47).fire();
          expect(x.rangeBand()).to.eql(10);
          expect(x.rangeExtent()).to.eql([27, 47]);
          expect(y.range()).to.eql([27, 47]);

          done();
        }, viewFactory);
      });

      it('should override range values', function(done) {
        var spec = {
          "data": [],
          "scales": [{
            "name": "x", "type": "ordinal", 
            "domain": [0, 1],  "range": [0, 1],
            "rangeMin": range[0], "rangeMax": range[1]
          }, {
            "name": "y", "type": "linear", 
            "domain": [0, 1], "range": [0, 1],
            "rangeMin": range[0], "rangeMax": range[1]
          }]
        };

        parseSpec(spec, function(model) {
          var group = model.scene().items[0],
              x = group.scale('x'),
              y = group.scale('y');

          expect(x.rangeBand()).to.eql((range[1]-range[0])/2);
          expect(x.rangeExtent()).to.eql(range);
          expect(y.range()).to.eql(range);

          done();
        }, viewFactory);
      });

      it('should support DataRef');
    });

    describe('DataRef', function() {
      it('should initialize', function(done) {
        var spec = {
          "data": [{
            "name": "table1", 
            "values": [{"c": "red"}, {"c": "green"}, {"c": "blue"}]
          }, {
            "name": "table2",
            "values": [{"c": "cyan"}, {"c": "yellow"}, {"c": "magenta"}]
          }],

          "scales": [{
            "name": "x", "type": "ordinal",
            "domain": [0, 1, 2],
            "range": {"data": "table1", "field": "c"}
          }, {
            "name": "y", "type": "ordinal",
            "domain": [0, 1, 2],
            "range": {
              "fields": [
                {"data": "table1", "field": "c"},
                {"data": "table2", "field": "c"}  
              ]
            }
          }]
        };

        parseSpec(spec, function(model) {
          var group = model.scene().items[0],
            x = group.scale('x'),
            y = group.scale('y');

            expect(x.range()).to.eql(['red', 'green', 'blue']);
            expect(y.range()).to.eql(['red', 'green', 'blue', 'cyan', 'yellow', 'magenta']);

            done();
        }, viewFactory);
      });

      it('should handle streaming adds');
      it('should handle streaming mods');
      it('should handle streaming rems');
    });
  });

  describe('Ordinal', function() {
    it('should distribute over uniform points', function(done) {
      var spec = {
        "data": [],
        "scales": [{
          "name": "x", "type": "ordinal", 
          "domain": [0, 1], 
          "range": range
        }, {
          "name": "y", "type": "ordinal", 
          "domain": [0, 1], 
          "range": range, "points": true
        }]
      };

      parseSpec(spec, function(model) {
        var group = model.scene().items[0],
            x = group.scale('x'),
            y = group.scale('y');

        expect(x.rangeBand()).to.eql((range[1]-range[0])/2);
        expect(x.rangeExtent()).to.eql(range);
        expect(y.range()).to.eql(range);

        done();
      }, viewFactory);
    });

    it('should support points via signal');

    it('should support padding', function(done) {
      var spec = {
        "data": [],
        "scales": [{
          "name": "x", "type": "ordinal", 
          "domain": [0, 1, 2], 
          "range": [0, 120], "padding": 0.2,
        }, {
          "name": "y", "type": "ordinal", 
          "domain": [0, 1, 2], 
          "range": [0, 120], "points": true, "padding": 1,
        }]
      };

      parseSpec(spec, function(model) {
        var group = model.scene().items[0],
            x = group.scale('x'),
            y = group.scale('y');

        expect(x.rangeBand()).to.eql(30);
        expect(x.range()).to.eql([8, 45, 82]);
        expect(y.range()).to.eql([20, 60, 100]);

        done();
      }, viewFactory);
    });

    it('should support padding via signal');
  });

  describe('Quantitative', function() {
    it('should clamp', function(done) {
      // d3.scale.linear.clamp tests
      var spec = {
        "data": [],
        "scales": [{
          "name": "x", 
          "domain": [-10, 0], 
          "range": ["red", "white", "green"], "clamp": true
        }, {
          "name": "y", 
          "domain": [-10, 0, 100], 
          "range": ["red", "white"], "clamp": true
        }]
      };

      parseSpec(spec, function(model) {
        var group = model.scene().items[0],
            x = group.scale('x'),
            y = group.scale('y');

        expect(x(-5)).to.equal("#ff8080");
        expect(x(50)).to.equal("#ffffff");

        expect(x(-5)).to.equal("#ff8080");
        expect(x(50)).to.equal("#ffffff");

        done();
      }, viewFactory);
    });

    it('should nice the domain values', function(done) {
      // d3.scale.linear.nice tests
      var spec = {
        "data": [],
        "scales": [{
          "name": "s1", "zero": false,
          "domain": [1.1, 10.9], "nice": true 
        }, {
          "name": "s2", "zero": false,
          "domain": [10.9, 1.1], "nice": true
        }, {
          "name": "s3", "zero": false,
          "domain": [.7, 11.001], "nice": true
        }, {
          "name": "s4", "zero": false,
          "domain": [123.1, 6.7], "nice": true
        }, {
          "name": "s5", "zero": false,
          "domain": [0, .49], "nice": true
        }]
      };

      parseSpec(spec, function(model) {
        var group = model.scene().items[0],
            s = group.scale;

        expect(s('s1').domain()).to.eql([1, 11]);
        expect(s('s2').domain()).to.eql([11, 1]);
        expect(s('s3').domain()).to.eql([0, 12]);
        expect(s('s4').domain()).to.eql([130, 0]);
        expect(s('s5').domain()).to.eql([0, .5]);

        done();
      }, viewFactory);
    });

    it('should start at zero', function(done) {
      var spec = {
        "data": [],
        "scales": [{
          "name": "s1", "zero": false,
          "domain": range
        }, {
          "name": "s2",
          "domain": range
        }]
      };

      parseSpec(spec, function(model) {
        var group = model.scene().items[0],
            s = group.scale;

        expect(s('s1').domain()).to.eql(range);
        expect(s('s2').domain()).to.eql([0, range[1]]);

        done();
      }, viewFactory);
    });

    it('should support signals for clamp, nice, zero');
  });

  describe('Pow', function() {
    it('should observe specified exponent', function(done) {
      // d3.scale.pow.exponent tests
      var spec = {
        "data": [],
        "scales": [{
          "name": "s1", "type": "pow",
          "domain": [1, 2], "range": [0, 1], "zero": false,
          "exponent": 0.5 
        }, {
          "name": "s2", "type": "pow",
          "domain": [1, 2], "range": [0, 1], "zero": false,
          "exponent": 2
        }, {
          "name": "s3", "type": "pow",
          "domain": [1, 2], "range": [0, 1], "zero": false,
          "exponent": -1
        }]
      };

      parseSpec(spec, function(model) {
        var group = model.scene().items[0],
            s1 = group.scale('s1'),
            s2 = group.scale('s2'),
            s3 = group.scale('s3');

        expect(s1(1)).to.be.closeTo(0, 1e-6);
        expect(s1(1.5)).to.be.closeTo(0.5425821, 1e-6);
        expect(s1(2)).to.be.closeTo(1, 1e-6);
        expect(s1.exponent()).to.equal(.5);

        expect(s2(1)).to.be.closeTo(0, 1e-6);
        expect(s2(1.5)).to.be.closeTo(.41666667, 1e-6);
        expect(s2(2)).to.be.closeTo(1, 1e-6);
        expect(s2.exponent()).to.equal(2);

        expect(s3(1)).to.be.closeTo(0, 1e-6);
        expect(s3(1.5)).to.be.closeTo(.6666667, 1e-6);
        expect(s3(2)).to.be.closeTo(1, 1e-6);
        expect(s3.exponent()).to.equal(-1);

        done();
      }, viewFactory);
    });

    it('should support signal exponents');
  });
})