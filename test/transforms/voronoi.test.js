describe('Voronoi', function() {

  var values = [
    {x: -1, y: -1},
    {x: +1, y: -1},
    {x: -1, y: +1},
    {x: +1, y: +1}
  ];

  var spec = {
    data: [{
      name: "table",
      values: values,
      transform: [{
        type: 'voronoi',
        x: 'x',
        y: 'y',
        clipExtent: [[-1e5,-1e5], [1e5,1e5]],
        output: {path: 'p'}
      }]
    }]
  };

  it('should compute voronoi diagram', function(done) {
    parseSpec(spec, function(model) {
      var data = model.data('table').values().sort(dl.comparator('p'));
      expect(data[0].p).to.equal('M-100000,0L0,0L0,-100000L-100000,-100000Z');
      expect(data[1].p).to.equal('M0,-100000L0,0L100000,0L100000,-100000Z');
      expect(data[2].p).to.equal('M0,0L0,100000L100000,100000L100000,0Z');
      expect(data[3].p).to.equal('M0,100000L0,0L-100000,0L-100000,100000Z');
      done();
    }, modelFactory);
  });

  it('should validate against the schema', function() {
    var schema = schemaPath(transforms.voronoi.schema),
        validate = validator(schema);

    expect(validate({ "type": "voronoi" })).to.be.true;
    expect(validate({ "type": "voronoi", "x": "field" })).to.be.true;
    expect(validate({ "type": "voronoi", "y": "field" })).to.be.true;
    expect(validate({ "type": "voronoi", "clipExtent": [[-1e5,-1e5],[1e5,1e5]] })).to.be.true;
    expect(validate({ "type": "voronoi", "output": {"path": "path"} })).to.be.true;

    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "voronoi", "x": 1 })).to.be.false;
    expect(validate({ "type": "voronoi", "y": 2 })).to.be.false;
    expect(validate({ "type": "voronoi", "clipExtent": "clip" })).to.be.false;
    expect(validate({ "type": "voronoi", "clipExtent": [-100, 100] })).to.be.false;
    expect(validate({ "type": "voronoi", "output": {"foo": "bar"} })).to.be.false;
    expect(validate({ "type": "voronoi", "foo": "bar" })).to.be.false;
  });

});