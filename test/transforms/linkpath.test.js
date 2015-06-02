describe('LinkPath', function() {

  it('should route edges');

  it('should validate against the schema', function() {
    var validate = validator(transforms.linkpath.schema);

    expect(validate({ "type": "linkpath" })).to.be.true;
    expect(validate({ "type": "linkpath", "source": "src" })).to.be.true;
    expect(validate({ "type": "linkpath", "target": "trgt" })).to.be.true;
    expect(validate({ "type": "linkpath", "x": "x" })).to.be.true;
    expect(validate({ "type": "linkpath", "y": "y" })).to.be.true;
    expect(validate({ "type": "linkpath", "tension": 0.1 })).to.be.true;
    expect(validate({ "type": "linkpath", "shape": "curve" })).to.be.true;
    expect(validate({ "type": "linkpath", "shape": "diagonal" })).to.be.true;
    expect(validate({ "type": "linkpath", "shape": "diagonalX" })).to.be.true;
    expect(validate({ "type": "linkpath", "shape": "diagonalY" })).to.be.true;
    expect(validate({ "type": "linkpath", "output": {"path": "path"} })).to.be.true;
    
    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "linkpath", "source": 1 })).to.be.false;
    expect(validate({ "type": "linkpath", "target": 2 })).to.be.false;
    expect(validate({ "type": "linkpath", "x": 3 })).to.be.false;
    expect(validate({ "type": "linkpath", "y": 4 })).to.be.false;
    expect(validate({ "type": "linkpath", "tension": "0.1" })).to.be.false;
    expect(validate({ "type": "linkpath", "shape": "foo" })).to.be.false;
    expect(validate({ "type": "linkpath", "output": {"foo": "bar"} })).to.be.false;
    expect(validate({ "type": "linkpath", "foo": "bar" })).to.be.false;
  });

});