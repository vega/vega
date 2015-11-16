describe('Cross', function() {
  var values1 = [
      {"x": 1,  "y": 28}, {"x": 2,  "y": 55},
      {"x": 3,  "y": 43}]
  var values2 = [
      {"x": 4,  "y": 91}, {"x": 5,  "y": 81}, 
      {"x": 6,  "y": 53}]

  var spec = {
    "data": [{
      "name": "table1",
      "values": values1
    }, {
      "name": "table2",
      "values": values2,
      "transform": [{
        "type": "cross",
        "with": "table1",
        "diagonal": true
      }]
    }]
  };

  it('should handle initial datasource', function(done) {
    parseSpec(spec, function(model) {
      var ds1 = model.data('table1'),
          ds2 = model.data('table2'),
          data1 = ds1.values(),
          data2 = ds2.values();

      expect(data1).to.have.length(3);
      expect(data2).to.have.length(9);
      //TODO: check cross content

      expect(ds2._output.fields).to.contain.keys(['a', 'b']);

      done();
    }, modelFactory);
  });

  it('should handle streaming adds', function(done) {
    parseSpec(spec, function(model) {
      var ds1 = model.data('table1'),
          ds2 = model.data('table2'),
          new1 = {"x": 7,  "y": 19}, 
          new2 = {"x": 8,  "y": 87},
          data1 = ds1.values(),
          data2 = ds2.values();

      expect(data1).to.have.length(3);
      expect(data2).to.have.length(9);
      expect(ds2._output.fields).to.contain.keys(['a', 'b']);

      ds1.insert([new1]).fire();
      data1 = ds1.values();
      data2 = ds2.values();

      expect(data1).to.have.length(4);
      expect(data2).to.have.length(12);
      expect(ds2._output.fields).to.contain.keys(['a', 'b']);

      ds2.insert([new2]).fire();
      data1 = ds1.values();
      data2 = ds2.values();
      expect(data1).to.have.length(4);
      expect(data2).to.have.length(16);
      expect(ds2._output.fields).to.contain.keys(['a', 'b']);

      done();
    }, modelFactory);

  });

  it('should handle streaming rems', function(done) {
    parseSpec(spec, function(model) {
      var ds1 = model.data('table1'),
          ds2 = model.data('table2'),
          data1 = ds1.values(),
          data2 = ds2.values();

      expect(data1).to.have.length(3);
      expect(data2).to.have.length(9);
      expect(ds2._output.fields).to.contain.keys(['a', 'b']);

      ds1.remove(function(x) { return x.x == 1; }).fire();
      data1 = ds1.values();
      data2 = ds2.values(); 

      expect(data1).to.have.length(2);
      expect(data2).to.have.length(6);
      expect(ds2._output.fields).to.contain.keys(['a', 'b']);

      ds2.remove(function(x) { return x.x == 4; }).fire();
      data1 = ds1.values();
      data2 = ds2.values(); 

      expect(data1).to.have.length(2);
      expect(data2).to.have.length(4);
      expect(ds2._output.fields).to.contain.keys(['a', 'b']);

      // Test that lazy removal is working correctly.
      ds2.update(function(x) { return x.x == 6; }, 
        'y', function(x) { return 600; }).fire();
      data1 = ds1.values(),
      data2 = ds2.values();

      expect(data1).to.have.length(2);
      expect(data2).to.have.length(4);
      expect(ds2._output.fields).to.contain.keys(['a', 'b']);

      done();
    }, modelFactory);

  });

  it('should propegate mod tuples', function(done) {
    parseSpec(spec, function(model) {
      var ds1 = model.data('table1'),
          ds2 = model.data('table2'),
          data1 = ds1.values(),
          data2 = ds2.values();

      expect(data1).to.have.length(3);
      expect(data2).to.have.length(9);
      expect(ds2._output.fields).to.contain.keys(['a', 'b']);

      ds2.update(function(x) { return x.x == 1; }, 
        'y', function(x) { return 100; }).fire();
      data1 = ds1.values(),
      data2 = ds2.values();

      expect(data1).to.have.length(3);
      expect(data2).to.have.length(9);
      expect(ds2._output.fields).to.contain.keys(['a', 'b']);

      ds2.update(function(x) { return x.x == 4; }, 
        'y', function(x) { return 400; }).fire();
      data1 = ds1.values(),
      data2 = ds2.values();

      expect(data1).to.have.length(3);
      expect(data2).to.have.length(9);
      expect(ds2._output.fields).to.contain.keys(['a', 'b']);

      done();
    }, modelFactory);

  });

  it('should allow renamed keys', function(done) {
    var s = dl.duplicate(spec);
      s.data[1].transform[0].output = {"left": "thing1", "right": "thing2"};

    parseSpec(s, function(model) {
      var ds1 = model.data('table1'),
          ds2 = model.data('table2'),
          data1 = ds1.values(),
          data2 = ds2.values();

      expect(data1).to.have.length(3);
      expect(data2).to.have.length(9);
      expect(ds2._output.fields).to.contain.keys(['thing1', 'thing2']);

      done();
    }, modelFactory);

  });

  it('should self cross', function(done) {
    var spec = {
      "data": [{
        "name": "table1", 
        "values": values1,
        "transform": [{"type": "cross"}]
      }]
    };

    parseSpec(spec, function(model) {
      var ds1 = model.data('table1'),
          data1 = ds1.values(),
          new1 = {"x": 7,  "y": 19}, 
          new2 = {"x": 8,  "y": 87};

      expect(data1).to.have.length(9);

      ds1.insert([new1, new2]).fire();
      data1 = ds1.values();
      expect(data1).to.have.length(25);

      ds1.remove(function(t) { return t.x === 8; }).fire();
      data1 = ds1.values();
      expect(data1).to.have.length(16);

      done();
    }, modelFactory);
  });

  it('should exclude diagonal values', function(done) {
    var spec = {
      "data": [{
        "name": "table1", 
        "values": values1,
        "transform": [{"type": "cross", "diagonal": false}]
      }]
    };

    parseSpec(spec, function(model) {
      var ds1 = model.data('table1'),
          data1 = ds1.values();

      expect(data1).to.have.length(6);

      done();
    }, modelFactory);
  });

  it('should exclude filtered values', function(done) {
    var spec = {
      "data": [{
        "name": "table1", 
        "values": values1,
        "transform": [{"type": "cross", "filter": "datum.a.x >= 2 && datum.b.y < 40"}]
      }]
    };

    parseSpec(spec, function(model) {
      var ds1 = model.data('table1'),
          data1 = ds1.values();

      expect(data1).to.have.length(2);

      done();
    }, modelFactory);
  });

  it('should recross on signal change', function(done) {
    var spec = {
      "signals": [
        {"name": "d", "init": true},
        {"name": "s", "init": 2}
      ],
      "data": [{
        "name": "table1",
        "values": values1,
        "transform": [{
          "type": "cross",
          "diagonal": {"signal": "d"},
          "filter": "datum.a.x >= s"
        }]
      }]
    };

    parseSpec(spec, function(model) {
      var ds1 = model.data('table1'),
          data1 = ds1.values(),
          out1  = ds1._output;

      expect(data1).to.have.length(6);
      expect(out1.add).to.have.length(6);
      expect(out1.mod).to.have.length(0);
      expect(out1.rem).to.have.length(0);

      model.signal('d').value(false).fire();
      data1 = ds1.values();
      out1  = ds1._output;
      expect(data1).to.have.length(4);
      expect(out1.rem).to.have.length(6);
      expect(out1.add).to.have.length(4);
      expect(out1.mod).to.have.length(0);

      model.signal('s').value(3).fire();
      data1 = ds1.values();
      out1  = ds1._output;
      expect(data1).to.have.length(2);
      expect(out1.rem).to.have.length(4);
      expect(out1.add).to.have.length(2);  
      expect(out1.mod).to.have.length(0);          

      done();
    }, modelFactory);
  });

  it('should validate against the schema', function() {
    var schema = schemaPath(transforms.cross.schema),
        validate = validator(schema);

    expect(validate({ "type": "cross" })).to.be.true;
    expect(validate({ "type": "cross", "with": "table" })).to.be.true;
    expect(validate({ "type": "cross", "with": "table", "diagonal": false })).to.be.true;
    expect(validate({ 
      "type": "cross", 
      "with": "table", 
      "output": {"left": "foo", "right": "bar"} 
    })).to.be.true;

    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "cross", "with": 5 })).to.be.false;
    expect(validate({ "type": "cross", "with": "table", "diagonal": 1 })).to.be.false;
    expect(validate({ 
      "type": "cross", 
      "with": "table", 
      "output": {"left": 1, "right": 2} 
    })).to.be.false;

    expect(validate({ 
      "type": "cross", 
      "with": "table", 
      "output": {"left": "foo", "right": "bar"},
      "hello": "world"
    })).to.be.false;
  });
  
});