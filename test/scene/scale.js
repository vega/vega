var Node = require('../../src/dataflow/Node');

describe.only('Scale', function() {

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
        model.scene(new Node(model.graph)).fire();

        var group = model.scene().items[0],
            x = group.scale('x'),
            y = group.scale('y');

        expect(x.domain()).to.eql(ord);
        expect(y.domain()).to.eql(lin);

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
          model.scene(new Node(model.graph)).fire();

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
          model.scene(new Node(model.graph)).fire();

          var group = model.scene().items[0],
              y = group.scale('y');

          expect(y.domain()).to.eql([0, 10]);

          model.graph.signal('min').value(5).fire();
          expect(y.domain()).to.eql([5, 10]);

          model.graph.signal('max').value(15).fire();
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
          model.scene(new Node(model.graph)).fire();

          var group = model.scene().items[0],
              y = group.scale('y');

          expect(y.domain()).to.eql([0, 10]);

          done();
        }, viewFactory);
      });

      it('should support DataRef');
    });

    describe('DataRef', function() {
      it('should handle data/field def', function(done) {
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
              "range": "height",
              "domain": {"data": "table", "field": "y"}
            }
          ],
        }
      });
    });

    


  });
})