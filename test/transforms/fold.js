var util = require('../../src/util/index');

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
        "fields": ["gold", "silver", "bronze"]
      }]
    }] 
  };

  function expectFold(val, data, idx, key, value) {
    if(!idx)   idx = values.indexOf(val)*3;
    if(!key)   key = "key";
    if(!value) value = "value";

    expect(data).to.have.deep.property('['+idx+'].country', val.country);
    expect(data).to.have.deep.property('['+idx+'].'+key, 'gold');
    expect(data).to.have.deep.property('['+idx+'].'+value, val.gold);

    expect(data).to.have.deep.property('['+(idx+1)+'].country', val.country);
    expect(data).to.have.deep.property('['+(idx+1)+'].'+key, 'silver');
    expect(data).to.have.deep.property('['+(idx+1)+'].'+value, val.silver);

    expect(data).to.have.deep.property('['+(idx+2)+'].country', val.country);
    expect(data).to.have.deep.property('['+(idx+2)+'].'+key, 'bronze');
    expect(data).to.have.deep.property('['+(idx+2)+'].'+value, val.bronze);
  }


  it('should handle initial datasource', function(done) {
    vg.parse.spec(spec, function(model) {
      var ds = model.data('table'),
          data, i, len, d;

      model.fire();
      data = ds.values();
      expect(data).to.have.length(6);
      expectFold(values[0], data);  // USA
      expectFold(values[1], data);  // Canada
      expect(ds._output.fields).to.have.keys(['key', 'value']);

      done();
    }, viewFactory);
  });

  it('should handle streaming adds', function(done) {
    vg.parse.spec(spec, function(model) {
      var ds = model.data('table'),
          mex = {"country": "Mexico", "gold": 3, "silver": 3, "bronze": 2},
          bel = {"country": "Belize", "gold": 0, "silver": 0, "bronze": 0},
          data, i, len, d;

      model.fire();
      data = ds.values();
      expect(data).to.have.length(6);
      expectFold(values[0], data);  // USA
      expectFold(values[1], data);  // Canada
      expect(ds._output.fields).to.have.keys(['key', 'value']);

      ds.add([mex, bel]).fire();
      data = ds.values();
      expect(data).to.have.length(12);
      expectFold(values[0], data);  // USA
      expectFold(values[1], data);  // Canada
      expectFold(mex, data, 6);     // Mexico
      expectFold(bel, data, 9);     // Belize
      expect(ds._output.fields).to.have.keys(['key', 'value']);

      done();
    }, viewFactory);
  });

  it('should handle streaming rems', function(done) {
    vg.parse.spec(spec, function(model) {
      var ds = model.data('table'),
          data, i, len, d;

      model.fire();
      data = ds.values();
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
    }, viewFactory);
  });

  it('should propagate mod tuples if fields updated', function(done) {
    vg.parse.spec(spec, function(model) {
      var ds = model.data('table'),
          data, i, len, d;

      model.fire();
      data = ds.values();
      expect(data).to.have.length(6);
      expectFold(values[0], data);  // USA
      expectFold(values[1], data);  // Canada
      expect(ds._output.fields).to.have.keys(['key', 'value']);

      ds.update(function(x) { return x.country == "US" }, 
        'gold', function(x) { return x.gold = 100, x; }).fire();
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
    }, viewFactory);
  });

  it('should only propagate mod tuples if fields not updated', function(done) {
    vg.parse.spec(spec, function(model) {
      var ds = model.data('table'),
          data, i, len, d;

      model.fire();
      data = ds.values();
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
    }, viewFactory);
  });

  it('should allow renamed keys', function(done) {
    var s = util.duplicate(spec);
    s.data[0].transform[0].output = {key: "type"};

    vg.parse.spec(s, function(model) {
      var ds = model.data('table'),
          data, i, len, d;

      model.fire();
      data = ds.values();
      expect(data).to.have.length(6);
      expectFold(values[0], data, null, "type");  // USA
      expectFold(values[1], data, null, "type");  // Canada
      expect(ds._output.fields).to.have.keys(['type', 'value']);

      done();
    }, viewFactory);
  });

  it('should allow renamed values', function(done) {
    var s = util.duplicate(spec);
    s.data[0].transform[0].output = {value: "medals"};

    vg.parse.spec(s, function(model) {
      var ds = model.data('table'),
          data, i, len, d;

      model.fire();
      data = ds.values();
      expect(data).to.have.length(6);
      expectFold(values[0], data, null, null, "medals");  // USA
      expectFold(values[1], data, null, null, "medals");  // Canada
      expect(ds._output.fields).to.have.keys(['key', 'medals']);

      done();
    }, viewFactory);
  });
});