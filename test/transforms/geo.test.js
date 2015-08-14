describe('Geo', function() {

  it('should calculate geo projection');

  it('should validate against the schema', function() {
    var schema = schemaPath(transforms.geo.schema),
        validate = validator(schema);

    
    expect(validate({ "type": "geo", "lat": "a", "lon": "b" })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "projection": "mercator" })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "projection": {"signal": "proj"} })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "center": [0,1] })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "center": [{"signal": "x"}, {"signal": "y"}] })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "center": {"signal": "center"} })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "translate": [0,1] })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "translate": [{"signal": "x"}, {"signal": "y"}] })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "translate": {"signal": "trans"} })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "rotate": 90 })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "rotate": {"signal": "rot"} })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "scale": 1000 })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "scale": {"signal": "scale"} })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "precision": 1 })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "precision": {"signal": "prec"} })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "clipAngle": 1 })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "clipAngle": {"signal": "ca"} })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "clipExtent": 10 })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "clipExtent": {"signal": "ce"} })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "output": {"x": "x"} })).to.be.true;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "output": {"y": "y"} })).to.be.true;

    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "geo" })).to.be.false;
    expect(validate({ "type": "geo", "lat": "a" })).to.be.false;
    expect(validate({ "type": "geo", "lon": "b" })).to.be.false;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "projection": 1 })).to.be.false;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "center": "foo" })).to.be.false;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "translate": "foo" })).to.be.false;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "rotate": "foo" })).to.be.false;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "scale": "foo" })).to.be.false;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "precision": "foo" })).to.be.false;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "clipAngle": "foo" })).to.be.false;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "clipExtent": "foo" })).to.be.false;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "output": {"foo": "bar"} })).to.be.false;
    expect(validate({ "type": "geo", "lat": "a", "lon": "b", "foo": "bar" })).to.be.false;
  });

});
