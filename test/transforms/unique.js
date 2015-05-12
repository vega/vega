describe('Unique', function() {
  var values = [
    {"country":"US", "type": "gold", "count": 12},
    {"country":"US", "type": "silver", "count": 13},
    {"country":"US", "type": "bronze", "count": 15},
    {"country":"Canada", "type": "gold", "count": 5},
    {"country":"Canada", "type": "silver", "count": 4},
    {"country":"Canada", "type": "bronze", "count": 3}
  ];

  function spec(on) {
    return {
      "signals": [{"name": "uniqueOn", "init": "country"}],

      "data": [{
        "name": "table",
        "values": values,
        "transform": [{"type": "unique", "field": on, "as": "unq"}]
      }]
    };
  }

  it('should handle initial datasource', function(done) {
    parseSpec(spec({"field": "country"}), function(model) {
      var ds = model.data('table'),
          data = ds.values();

      expect(data).to.have.length(2);
      expect(data[0]).to.have.property('unq', 'US');
      expect(data[1]).to.have.property('unq', 'Canada');

      done();
    }, modelFactory);
  });

  it('should handle streaming adds', function(done) {
    parseSpec(spec({"field": "country"}), function(model) {
      var ds = model.data('table'),
          data = ds.values();

      expect(data).to.have.length(2);
      expect(data[0]).to.have.property('unq', 'US');
      expect(data[1]).to.have.property('unq', 'Canada');

      var a1 = {"country": "US", "type": "platinum", "count": 2},
          a2 = {"country": "Canada", "type": "platinum", "count": 3},
          a3 = {"country": "Mexico", "type": "platinum", "count": 1};

      ds.add([a1, a2, a3]).fire();
      data = ds.values();
      expect(data).to.have.length(3);
      expect(data[0]).to.have.property('unq', 'US');
      expect(data[1]).to.have.property('unq', 'Canada');
      expect(data[2]).to.have.property('unq', 'Mexico');

      done();
    }, modelFactory)
  });

  it('should handle streaming mods', function(done) {
    parseSpec(spec({"field": "country"}), function(model) {
      var ds = model.data('table'),
          data = ds.values();

      expect(data).to.have.length(2);
      expect(data[0]).to.have.property('unq', 'US');
      expect(data[1]).to.have.property('unq', 'Canada');

      ds.update(function(x) { return x.country === "Canada" },
          "country", function(x) { return "Mexico" }).fire();
      data = ds.values();
      expect(data).to.have.length(2);
      expect(data[0]).to.have.property('unq', 'US');
      expect(data[1]).to.have.property('unq', 'Mexico');

      done();
    }, modelFactory)
  });

  it('should handle streaming rems', function(done) {
    parseSpec(spec({"field": "country"}), function(model) {
      var ds = model.data('table'),
          data = ds.values();

      expect(data).to.have.length(2);
      expect(data[0]).to.have.property('unq', 'US');
      expect(data[1]).to.have.property('unq', 'Canada');

      ds.remove(function(x) { return x.country === "Canada" }).fire();
      data = ds.values();
      expect(data).to.have.length(1);
      expect(data[0]).to.have.property('unq', 'US');

      done();
    }, modelFactory)
  });

  it('should handle uniques over signal', function(done) {
    parseSpec(spec({"signal": "uniqueOn"}), function(model) {
      var ds = model.data('table'),
          data = ds.values();

      expect(data).to.have.length(2);
      expect(data[0]).to.have.property('unq', 'US');
      expect(data[1]).to.have.property('unq', 'Canada');

      model.signal('uniqueOn').value('type').fire();
      data = ds.values();
      expect(data).to.have.length(3);
      expect(data[0]).to.have.property('unq', 'gold');
      expect(data[1]).to.have.property('unq', 'silver');
      expect(data[2]).to.have.property('unq', 'bronze');

      done();
    }, modelFactory)
  });
});