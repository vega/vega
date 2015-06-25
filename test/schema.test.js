describe('Schema', function() {
  var schema = require('../src/core/schema')({
    properties: {a: "string", b: "string"}  // Custom properties for linking example
  });

  describe('Transforms', function() {
    var transforms = require('../src/transforms'),
        keys = Object.keys(transforms),
        i = 0, len = keys.length;

    keys.forEach(function(k) {
      var t = transforms[k];
      it(k+' should be defined', function() { expect(t.schema).to.be.an('object'); });
    });
  });

  describe('Defs', function() {
    it('should validate data sets', function() {
      var validate = validator(schemaPath({"$ref": "#/defs/data"}));

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
    });

    it('should validate interactors');
    it('should validate signals');
    it('should validate predicates');
    it('should validate scales');
    it('should validate marks');
  });
  
  describe('Examples', function() {
    var fs = require('fs'),
        path = require('path'),
        config = require('../src/core/config'),
        examples = "./examples/spec/",
        validate = validator(schema);

    expect(fs.statSync(examples).isDirectory()).to.equal(true);
    var files = fs.readdirSync(examples).filter(function(name) {
      return path.extname(name) === ".json";
    });

    config.load.baseURL = 'file://' + examples + "../"; // needed for data loading

    files.forEach(function(file, idx) {
      var name = path.basename(file, ".json");

      it('should validate the '+ name + ' example', function() {
        var spec = dl.json(examples + file);
        expect(validate(spec)).to.be.true;
      });
    });

  });
});