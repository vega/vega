describe('Fold', function() {
  var values = [
    {"country":"US", "gold":12, "silver":13, "bronze":15},
    {"country":"Canada", "gold": 5, "silver": 4, "bronze": 3}
  ];

  var spec = {
    "data": [{ 
      "name": "table", 
      "values": values,
      "transform": [{
        "type": "fold", 
        "fields": [{"field": "gold"}, {"field": "silver"}, {"field": "bronze"}]
      }]
    }] 
  };

  function expectFold(val, data, idx, key, value) {
    if(!idx)   idx = values.indexOf(val)*3;
    if(!key)   key = "key";
    if(!value) value = "value";

    expect(data[idx]).to.have.property('country', val.country);
    expect(data[idx]).to.have.property(key, 'gold');
    expect(data[idx]).to.have.property(value, val.gold);

    expect(data[idx+1]).to.have.property('country', val.country);
    expect(data[idx+1]).to.have.property(key, 'silver');
    expect(data[idx+1]).to.have.property(value, val.silver);

    expect(data[idx+2]).to.have.property('country', val.country);
    expect(data[idx+2]).to.have.property(key, 'bronze');
    expect(data[idx+2]).to.have.property(value, val.bronze);
  }


  it('should handle initial datasource', function(done) {
    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(6);
      expectFold(values[0], data);  // USA
      expectFold(values[1], data);  // Canada
      expect(ds._output.fields).to.have.keys(['key', 'value']);

      done();
    }, modelFactory);
  });

  it('should handle streaming adds', function(done) {
    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          mex = {"country": "Mexico", "gold": 3, "silver": 3, "bronze": 2},
          bel = {"country": "Belize", "gold": 0, "silver": 0, "bronze": 0},
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(6);
      expectFold(values[0], data);  // USA
      expectFold(values[1], data);  // Canada
      expect(ds._output.fields).to.have.keys(['key', 'value']);

      ds.insert([mex, bel]).fire();
      data = ds.values();
      expect(data).to.have.length(12);
      expectFold(values[0], data);  // USA
      expectFold(values[1], data);  // Canada
      expectFold(mex, data, 6);     // Mexico
      expectFold(bel, data, 9);     // Belize
      expect(ds._output.fields).to.have.keys(['key', 'value']);

      done();
    }, modelFactory);
  });

  it('should handle streaming rems', function(done) {
    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(6);
      expectFold(values[0], data);  // USA
      expectFold(values[1], data);  // Canada
      expect(ds._output.fields).to.have.keys(['key', 'value']);

      ds.remove(function(x) { return x.country == "Canada" }).fire();
      data = ds.values();
      expect(data).to.have.length(3);
      expectFold(values[0], data);  // USA
      expect(ds._output.fields).to.have.keys(['key', 'value']);

      done();
    }, modelFactory);
  });

  it('should propagate mod tuples if fields updated', function(done) {
    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(6);
      expectFold(values[0], data);  // USA
      expectFold(values[1], data);  // Canada
      expect(ds._output.fields).to.have.keys(['key', 'value']);

      ds.update(function(x) { return x.country == "US" }, 
        'gold', function(x) { return 100; }).fire();
      data = ds.values();
      expect(data).to.have.length(6);
      expectFold(values[1], data);  // Canada

      expect(data).to.have.deep.property('[0].country', 'US');
      expect(data).to.have.deep.property('[0].key', 'gold');
      expect(data).to.have.deep.property('[0].value', 100);

      expect(data).to.have.deep.property('[1].country', 'US');
      expect(data).to.have.deep.property('[1].key', 'silver');
      expect(data).to.have.deep.property('[1].value', 13);

      expect(data).to.have.deep.property('[2].country', 'US');
      expect(data).to.have.deep.property('[2].key', 'bronze');
      expect(data).to.have.deep.property('[2].value', 15);

      expect(ds._output.fields).to.have.keys(['gold', 'key', 'value']);

      done();
    }, modelFactory);
  });

  it('should only propagate mod tuples if fields not updated', function(done) {
    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(6);
      expectFold(values[0], data);  // USA
      expectFold(values[1], data);  // Canada
      expect(ds._output.fields).to.have.keys(['key', 'value']);

      model.fire();
      data = ds.values();
      expect(data).to.have.length(6);
      expectFold(values[0], data);  // USA
      expectFold(values[1], data);  // Canada
      expect(ds._output.fields).to.not.have.keys(['key', 'value']);

      done();
    }, modelFactory);
  });

  it('should allow renamed keys', function(done) {
    var s = util.duplicate(spec);
    s.data[0].transform[0].output = {key: "type"};

    parseSpec(s, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(6);
      expectFold(values[0], data, null, "type");  // USA
      expectFold(values[1], data, null, "type");  // Canada
      expect(ds._output.fields).to.have.keys(['type', 'value']);

      done();
    }, modelFactory);
  });

  it('should allow renamed values', function(done) {
    var s = util.duplicate(spec);
    s.data[0].transform[0].output = {value: "medals"};

    parseSpec(s, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(6);
      expectFold(values[0], data, null, null, "medals");  // USA
      expectFold(values[1], data, null, null, "medals");  // Canada
      expect(ds._output.fields).to.have.keys(['key', 'medals']);

      done();
    }, modelFactory);
  });

  it('should allow array<signal> for fields?');
});