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
    parseSpec(spec({}),
      function(model) {
        var nodes = model.data('vertices').values(),
            links = model.data('edges').values();

        for (var l=0; l<links.length; ++l) {
          var link = links[l];
          var source = link['force:source'];
          var target = link['force:target'];
          expect(source).to.have.property('_id', nodes[link.source]['_id']);
          expect(target).to.have.property('_id', nodes[link.target]['_id']);
        }

        done();
      },
      modelFactory);
  });

  it('should respect link distances', function(done) {
    var linkDistances = [20, 100, 200];
    
    linkDistances.forEach(function(dist, i) {
      parseSpec(spec({linkDistance: dist, iterations: 100}),
        function(model) {
          var nodes = model.data('vertices').values(),
              links = model.data('edges').values();

          for (var l=0; l<links.length; ++l) {
            var link = links[l];
            var source = link['force:source'];
            var target = link['force:target'];  
            var dx = target['force:x'] - source['force:x'];
            var dy = target['force:y'] - source['force:y'];
            var dd = Math.sqrt(dx*dx + dy*dy);
            expect(dd).closeTo(dist, EPSILON * dist);
          }

          if (i == linkDistances.length - 1) done();
        },
        modelFactory);
    });
  });

});