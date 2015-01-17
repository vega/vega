describe('Facet', function() {
  var values = [
    {"country":"US", "type": "gold", "count": 12},
    {"country":"US", "type": "silver", "count": 13},
    {"country":"US", "type": "bronze", "count": 15},
    {"country":"Canada", "type": "gold", "count": 5},
    {"country":"Canada", "type": "silver", "count": 4},
    {"country":"Canada", "type": "bronze", "count": 3}
  ];

  var spec = {
    "data": [{
      "name": "table",
      "values": values,
      "transform": [{"type": "facet", "keys": ["country"]}]
    }]
  };

  function expectFacet(facets, idx, min, max) {
    var i, len = max-min+1;

    expect(facets[idx]).to.have.property('key', values[min].country);
    expect(facets[idx].keys).to.eql([values[min].country]);
    expect(facets[idx].values).to.have.length(len);

    for(i=0; i<len; ++i) {
      expect(facets[idx].values[i].__proto__).to.deep.eql(values[min+i]);
    }
  }

  it('should handle initial datasource', function(done) {
    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          facets, i, len;

      model.fire();
      facets = ds.values();
      expect(facets).to.have.length(2);

      expectFacet(facets, 0, 0, 2); // USA
      expectFacet(facets, 1, 3, 5); // Canada

      done();
    }, viewFactory);
  });

  it('should handle streaming adds', function(done) {
    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          facets, i, len;

      model.fire();
      facets = ds.values();
      expect(facets).to.have.length(2);
      expectFacet(facets, 0, 0, 2); // USA
      expectFacet(facets, 1, 3, 5); // Canada

      var a1 = {"country": "US", "type": "platinum", "count": 2},
          a2 = {"country": "Canada", "type": "platinum", "count": 3},
          a3 = {"country": "Mexico", "type": "platinum", "count": 1};

      values.splice(3, 0, a1);
      values.push(a2, a3);
      ds.add([a1, a2, a3]).fire();
      facets = ds.values();
      expect(facets).to.have.length(3);
      expectFacet(facets, 0, 0, 3); // USA
      expectFacet(facets, 1, 4, 7); // Canada
      expectFacet(facets, 2, 8, 8); // Mexico

      done();
    }, viewFactory);
  });

  it('should handle streaming mods', function(done) {
    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          facets, i, len;

      model.fire();
      facets = ds.values();
      expect(facets).to.have.length(3);
      expectFacet(facets, 0, 0, 3); // USA
      expectFacet(facets, 1, 4, 7); // Canada
      expectFacet(facets, 2, 8, 8); // Mexico

      // Changing inner values
      values[3].type = "neon";
      values[7].type = "neon";
      values[8].type = "neon";
      ds.update(function(x) { return x.type === "platinum" },
          "type", function(x) { return "neon" }).fire();
      facets = ds.values();
      expect(facets).to.have.length(3);
      expectFacet(facets, 0, 0, 3); // USA
      expectFacet(facets, 1, 4, 7); // Canada
      expectFacet(facets, 2, 8, 8); // Mexico

      // Changing key field
      values[8].country = "India";
      ds.update(function(x) { return x.country === "Mexico" }, 
        "country", function(x) { return "India"; }).fire();
      facets = ds.values();
      expect(facets).to.have.length(3);
      expectFacet(facets, 0, 0, 3); // USA
      expectFacet(facets, 1, 4, 7); // Canada
      expectFacet(facets, 2, 8, 8); // India

      done();
    }, viewFactory);
  });

  it('should handle streaming rems', function(done) {
    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          facets, i, len;

      model.fire();
      facets = ds.values();
      expect(facets).to.have.length(3);
      expectFacet(facets, 0, 0, 3); // USA
      expectFacet(facets, 1, 4, 7); // Canada
      expectFacet(facets, 2, 8, 8); // India

      values.splice(3, 1);
      values.splice(6, 1);
      ds.remove(function(x) { return x.type === "neon" }).fire();
      facets = ds.values();
      expect(facets).to.have.length(2);
      expectFacet(facets, 0, 0, 2); // USA
      expectFacet(facets, 1, 3, 5); // Canada

      done();
    }, viewFactory);    
  })

  it('should allow array<signal> for keys?');
});