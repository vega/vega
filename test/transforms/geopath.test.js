describe('GeoPath', function() {

  it('should calculate geopath');

  it('should validate against the schema', function() {
    var schema = schemaPath(transforms.geopath.schema),
        validate = validator(schema);

    expect(validate({ "type": "geopath" })).to.be.true;
    expect(validate({ "type": "geopath", "field": "geojson" })).to.be.true;
    expect(validate({ "type": "geopath", "field": {"signal": "geojson"} })).to.be.true;
    expect(validate({ "type": "geopath", "projection": "mercator" })).to.be.true;
    expect(validate({ "type": "geopath", "projection": {"signal": "proj"} })).to.be.true;
    expect(validate({ "type": "geopath", "center": [0,1] })).to.be.true;
    expect(validate({ "type": "geopath", "center": [{"signal": "x"}, {"signal": "y"}] })).to.be.true;
    expect(validate({ "type": "geopath", "center": {"signal": "center"} })).to.be.true;
    expect(validate({ "type": "geopath", "translate": [0,1] })).to.be.true;
    expect(validate({ "type": "geopath", "translate": [{"signal": "x"}, {"signal": "y"}] })).to.be.true;
    expect(validate({ "type": "geopath", "translate": {"signal": "trans"} })).to.be.true;
    expect(validate({ "type": "geopath", "rotate": 90 })).to.be.true;
    expect(validate({ "type": "geopath", "rotate": {"signal": "rot"} })).to.be.true;
    expect(validate({ "type": "geopath", "scale": 1000 })).to.be.true;
    expect(validate({ "type": "geopath", "scale": {"signal": "scale"} })).to.be.true;
    expect(validate({ "type": "geopath", "precision": 1 })).to.be.true;
    expect(validate({ "type": "geopath", "precision": {"signal": "prec"} })).to.be.true;
    expect(validate({ "type": "geopath", "clipAngle": 1 })).to.be.true;
    expect(validate({ "type": "geopath", "clipAngle": {"signal": "ca"} })).to.be.true;
    expect(validate({ "type": "geopath", "clipExtent": 10 })).to.be.true;
    expect(validate({ "type": "geopath", "clipExtent": {"signal": "ce"} })).to.be.true;
    expect(validate({ "type": "geopath", "output": {"path": "p"} })).to.be.true;

    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "geopath", "field": 1 })).to.be.false;
    expect(validate({ "type": "geopath", "projection": 2 })).to.be.false;
    expect(validate({ "type": "geopath", "center": "foo" })).to.be.false;
    expect(validate({ "type": "geopath", "translate": "foo" })).to.be.false;
    expect(validate({ "type": "geopath", "rotate": "foo" })).to.be.false;
    expect(validate({ "type": "geopath", "scale": "foo" })).to.be.false;
    expect(validate({ "type": "geopath", "precision": "foo" })).to.be.false;
    expect(validate({ "type": "geopath", "clipAngle": "foo" })).to.be.false;
    expect(validate({ "type": "geopath", "clipExtent": "foo" })).to.be.false;
    expect(validate({ "type": "geopath", "output": {"foo": "bar"} })).to.be.false;
    expect(validate({ "type": "geopath", "foo": "bar" })).to.be.false;
  });

});
