describe('Force', function() {

  var EPSILON = 0.25; // within 25%

  var vertices = [
    {label: 'a'},
    {label: 'b'},
    {label: 'c'},
  ];

  var edges = [
    {source: 0, target: 1},
    {source: 0, target: 2},
    {source: 1, target: 2}
  ];

  function spec(opt) {
    var force = {
      type: "force",
      links: "edges"
    };
    for (var key in opt) {
      force[key] = opt[key];
    }

    return {
      data: [
        {
          name: "edges",
          values: edges
        },
        {
          name: "vertices",
          values: vertices,
          transform: [force]
        }
      ]
    };
  }

  it('should perform layout', function(done) {
    parseSpec(spec({}), modelFactory,
      function(error, model) {
        var nodes = model.data('vertices').values(),
            links = model.data('edges').values();

        for (var n=0; n<nodes.length; ++n) {
          var node = nodes[n];
          expect(node['layout_x']).to.be.gt(0);
          expect(node['layout_y']).to.be.gt(0);
        }

        done();
      });
  });

  it('should respect link distances', function(done) {
    var linkDistances = [20, 100, 200];

    linkDistances.forEach(function(dist, i) {
      parseSpec(spec({linkDistance: dist, iterations: 100}), modelFactory,
        function(error, model) {
          var nodes = model.data('vertices').values(),
              links = model.data('edges').values();

          for (var l=0; l<links.length; ++l) {
            var link = links[l];
            var source = nodes[link['source']];
            var target = nodes[link['target']];
            var dx = target['layout_x'] - source['layout_x'];
            var dy = target['layout_y'] - source['layout_y'];
            var dd = Math.sqrt(dx*dx + dy*dy);
            expect(dd).closeTo(dist, EPSILON * dist);
          }

          if (i == linkDistances.length - 1) done();
        });
    });
  });

  it('should validate against the schema', function() {
    var schema = schemaPath(transforms.force.schema),
        validate = validator(schema);

    expect(validate({ "type": "force", "links": "edges" })).to.be.true;
    expect(validate({ "type": "force", "links": "edges", "size": [100, 100] })).to.be.true;
    expect(validate({ "type": "force", "links": "edges", "linkDistance": 30 })).to.be.true;
    //expect(validate({ "type": "force", "links": "edges", "linkDistance": "foo" })).to.be.true;
    expect(validate({ "type": "force", "links": "edges", "linkStrength": 30 })).to.be.true;
    //expect(validate({ "type": "force", "links": "edges", "linkStrength": "foo" })).to.be.true;
    expect(validate({ "type": "force", "links": "edges", "charge": 30 })).to.be.true;
    //expect(validate({ "type": "force", "links": "edges", "charge": "foo" })).to.be.true;
    expect(validate({ "type": "force", "links": "edges", "chargeDistance": 30 })).to.be.true;
    expect(validate({ "type": "force", "links": "edges", "iterations": 100 })).to.be.true;
    expect(validate({ "type": "force", "links": "edges", "friction": 0.5 })).to.be.true;
    expect(validate({ "type": "force", "links": "edges", "theta": 0.4 })).to.be.true;
    expect(validate({ "type": "force", "links": "edges", "gravity": 0.4 })).to.be.true;
    expect(validate({ "type": "force", "links": "edges", "alpha": 0.4 })).to.be.true;
    expect(validate({ "type": "force", "links": "edges", "output": {"x": "x", "y": "y"} })).to.be.true;

    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "force" })).to.be.false;
    expect(validate({ "type": "force", "links": true })).to.be.false;
    expect(validate({ "type": "force", "links": "edges", "foo": "bar" })).to.be.false;
    expect(validate({ "type": "force", "links": "edges", "size": "[100, 100]" })).to.be.false;
    expect(validate({ "type": "force", "links": "edges", "size": 100 })).to.be.false;
    expect(validate({ "type": "force", "links": "edges", "size": [100, 100, 100] })).to.be.false;
    expect(validate({ "type": "force", "links": "edges", "iterations": "100" })).to.be.false;
    expect(validate({ "type": "force", "links": "edges", "friction": "0.5" })).to.be.false;
    expect(validate({ "type": "force", "links": "edges", "theta": "0.4" })).to.be.false;
    expect(validate({ "type": "force", "links": "edges", "gravity": "0.4" })).to.be.false;
    expect(validate({ "type": "force", "links": "edges", "alpha": "0.4" })).to.be.false;
  });

});