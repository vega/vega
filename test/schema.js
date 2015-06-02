describe('Schema', function() {

  describe('Transforms', function() {
    var transforms = require('../src/transforms'),
        keys = Object.keys(transforms),
        i = 0, len = keys.length;

    keys.forEach(function(k) {
      var t = transforms[k];
      it(k+' should be defined', function() { expect(t.schema).to.be.an('object'); });
    });
  });

  it('should validate data set definitions', function() {
    var parseData = require('../src/parse/data'),
        validate  = validator(parseData.schema);

    expect(validate({ "name": "table", "values": [1, 2, 3] })).to.be.true;
    expect(validate({ "name": "table", "values": [{x: 1}, {x: 2}, {x: 3}] })).to.be.true;
    expect(validate({ "name": "table", "source": "raw" })).to.be.true;
    expect(validate({ "name": "table", "url": "values.json" })).to.be.true;

    expect(validate({ "values": [1, 2, 3] })).to.be.false;
    expect(validate({ "source": "raw" })).to.be.false;
    expect(validate({ "url": "values.json" })).to.be.false;
    expect(validate({ "name": "table", "values": [1, 2, 3], "source": "raw" })).to.be.false;
    expect(validate({ "name": "table", "values": [1, 2, 3], "url": "values.json" })).to.be.false;
    expect(validate({ "name": "table", "source": "raw", "url": "values.json" })).to.be.false;

    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "json", "property": "children"} })).to.be.true;
    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "json", "parse": {"foo": "number"}} })).to.be.true;
    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "json", "parse": {"foo": "bar"}} })).to.be.false;
    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "json", "foo": "bar"} })).to.be.false;

    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "csv", "parse": {"price": "number"}} })).to.be.true;    
    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "tsv", "parse": {"price": "number"}} })).to.be.true;  
    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "csv", "parse": {"price": "foobar"}} })).to.be.false;
    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "csv", "foo": "bar"} })).to.be.false;

    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "topojson", "feature": "countries"} })).to.be.true;
    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "topojson", "mesh": "counties"} })).to.be.true;
    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "topojson", "feature": "countries", "mesh": "counties"} })).to.be.false;

    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "treejson", "children": "classes", "parse": {"price": "number"}} })).to.be.true;    
    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "treejson", "parse": {"price": "number"}} })).to.be.true;    
    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "treejson", "parse": {"price": "foobar"}} })).to.be.false;
    expect(validate({ "name": "table", "source": "raw", 
      "format": {"type": "treejson", "foo": "bar"} })).to.be.false;
  })

});