describe('LinkPath', function() {

  it('should route edges');

  it('should validate against the schema', function() {
    var schema = schemaPath(transforms.linkpath.schema),
        validate = validator(schema);

    expect(validate({ "type": "linkpath" })).to.be.true;
    expect(validate({ "type": "linkpath", "sourceX": "sx" })).to.be.true;
    expect(validate({ "type": "linkpath", "targetX": "tx" })).to.be.true;
    expect(validate({ "type": "linkpath", "sourceY": "sy" })).to.be.true;
    expect(validate({ "type": "linkpath", "targetY": "ty" })).to.be.true;
    expect(validate({ "type": "linkpath", "tension": 0.1 })).to.be.true;
    expect(validate({ "type": "linkpath", "shape": "curve" })).to.be.true;
    expect(validate({ "type": "linkpath", "shape": "diagonalX" })).to.be.true;
    expect(validate({ "type": "linkpath", "shape": "diagonalY" })).to.be.true;
    expect(validate({ "type": "linkpath", "shape": "diagonalR" })).to.be.true;
    expect(validate({ "type": "linkpath", "shape": "cornerX" })).to.be.true;
    expect(validate({ "type": "linkpath", "shape": "cornerY" })).to.be.true;
    expect(validate({ "type": "linkpath", "shape": "cornerR" })).to.be.true;
    expect(validate({ "type": "linkpath", "output": {"path": "path"} })).to.be.true;

    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "linkpath", "sourceX": 1 })).to.be.false;
    expect(validate({ "type": "linkpath", "targetX": 2 })).to.be.false;
    expect(validate({ "type": "linkpath", "sourceY": 3 })).to.be.false;
    expect(validate({ "type": "linkpath", "targetY": 4 })).to.be.false;
    expect(validate({ "type": "linkpath", "tension": "0.1" })).to.be.false;
    expect(validate({ "type": "linkpath", "shape": "foo" })).to.be.false;
    expect(validate({ "type": "linkpath", "output": {"foo": "bar"} })).to.be.false;
    expect(validate({ "type": "linkpath", "foo": "bar" })).to.be.false;
  });

});