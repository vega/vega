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
    "signals": [{"name": "keys", "init": "country"}],

    "data": [{
      "name": "table",
      "values": values,
      "transform": [{"type": "facet", "groupby": [{"field": "country"}]}]
    }]
  };

  function expectFacet(facets, idx, min, max) {
    var i, len = max-min+1;

    expect(facets[idx]).to.have.property('key', values[min].country);
    expect(facets[idx].values).to.have.length(len);

    for(i=0; i<len; ++i) {
      expect(facets[idx].values[i]).to.deep.include(values[min+i]);
    }
  }

  it('should handle initial datasource', function(done) {
    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          facets = ds.values(), 
          i, len;

      expect(facets).to.have.length(2);
      expectFacet(facets, 0, 0, 2); // USA
      expectFacet(facets, 1, 3, 5); // Canada

      done();
    }, modelFactory);
  });

  it('should handle streaming adds', function(done) {
    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          facets = ds.values(), 
          i, len;

      expect(facets).to.have.length(2);
      expectFacet(facets, 0, 0, 2); // USA
      expectFacet(facets, 1, 3, 5); // Canada

      var a1 = {"country": "US", "type": "platinum", "count": 2},
          a2 = {"country": "Canada", "type": "platinum", "count": 3},
          a3 = {"country": "Mexico", "type": "platinum", "count": 1};

      values.splice(3, 0, a1);
      values.push(a2, a3);
      ds.insert(dl.duplicate([a1, a2, a3])).fire();
      facets = ds.values();
      expect(facets).to.have.length(3);
      expectFacet(facets, 0, 0, 3); // USA
      expectFacet(facets, 1, 4, 7); // Canada
      expectFacet(facets, 2, 8, 8); // Mexico

      done();
    }, modelFactory);
  });

  it('should handle streaming mods', function(done) {
    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          facets = ds.values(),
          i, len;

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
    }, modelFactory);
  });

  it('should handle streaming rems', function(done) {
    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          facets = ds.values(), 
          i, len;

      expect(facets).to.have.length(3);
      expectFacet(facets, 0, 0, 3); // USA
      expectFacet(facets, 1, 4, 7); // Canada
      expectFacet(facets, 2, 8, 8); // India

      values.splice(3, 1); // USA-neon
      values.splice(6, 1); // Canada-neon
      values.pop(); // India-neon
      ds.remove(function(x) { return x.type === "neon" }).fire();
      facets = ds.values();
      expect(facets).to.have.length(2);
      expectFacet(facets, 0, 0, 2); // USA
      expectFacet(facets, 1, 3, 5); // Canada

      done();
    }, modelFactory);    
  })

  it('should handle signals as keys', function(done) {
    var s = dl.duplicate(spec);
    spec.data[0].transform[0].groupby = [{"signal": "keys"}];

    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          facets = ds.values(), 
          i, len;

      expect(facets).to.have.length(2);
      expectFacet(facets, 0, 0, 2); // USA
      expectFacet(facets, 1, 3, 5); // Canada

      model.signal('keys').value('type').fire();
      facets = ds.values();
      expect(facets).to.have.length(3);

      expect(facets[0]).to.have.property('key', 'gold');
      expect(facets[1]).to.have.property('key', 'silver');
      expect(facets[2]).to.have.property('key', 'bronze');

      expect(facets[0].values).to.have.length(2);
      expect(facets[1].values).to.have.length(2);
      expect(facets[2].values).to.have.length(2);

      done();
    }, modelFactory);      
  });

  it('should handle fields+signals as keys', function(done) {
    var s = dl.duplicate(spec);
    spec.signals[0].init = 'type';
    spec.data[0].transform[0].groupby = [{"field": "country"}, {"signal": "keys"}];

    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          facets = ds.values(), 
          i, len;

      expect(facets).to.have.length(6);
      expect(facets[0]).to.have.property('key', 'US|gold');
      expect(facets[1]).to.have.property('key', 'US|silver');
      expect(facets[2]).to.have.property('key', 'US|bronze');
      expect(facets[0].values).to.have.length(1);
      expect(facets[1].values).to.have.length(1);
      expect(facets[2].values).to.have.length(1);

      expect(facets[3]).to.have.property('key', 'Canada|gold');
      expect(facets[4]).to.have.property('key', 'Canada|silver');
      expect(facets[5]).to.have.property('key', 'Canada|bronze');
      expect(facets[3].values).to.have.length(1);
      expect(facets[4].values).to.have.length(1);
      expect(facets[5].values).to.have.length(1);

      done();
    }, modelFactory);      
  });

  it('should compute summaries on facets', function(done) {
    var spec = {
      "data": [{
        "name": "table",
        "values": values,
        "transform": [{
          "type": "facet",
          "groupby": [{"field": "country"}],
          "summarize": {
            "count": ["count", "sum", "min", "max"]
          }
        }]
      }]
    };

    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          data = ds.values();

      expect(data).to.have.length(2);

      expect(data[0]).to.have.property('key', 'US');
      expect(data[0]).to.have.property('count_count', 3);
      expect(data[0]).to.have.property('sum_count', 40);
      expect(data[0]).to.have.property('min_count', 12);
      expect(data[0]).to.have.property('max_count', 15);

      expect(data[1]).to.have.property('key', 'Canada');
      expect(data[1]).to.have.property('count_count', 3);
      expect(data[1]).to.have.property('sum_count', 12);
      expect(data[1]).to.have.property('min_count', 3);
      expect(data[1]).to.have.property('max_count', 5);

      done();
    }, modelFactory);
  });

  it('should transform faceted values');

  it('should validate against the schema', function() {
    var schema = schemaPath(transforms.facet.schema),
        validate = validator(schema);

    expect(validate({ "type": "facet", "groupby": ["country"] })).to.be.true;

    expect(validate({ 
      "type": "facet",
      "groupby": ["country"],
      "summarize": {
        "medals": ["count", "min", "max"],
        "gdp": ["argmin", "argmax"]
      }
    })).to.be.true;

    expect(validate({ 
      "type": "facet",
      "groupby": ["country"],
      "summarize": [
        {"name": "medals", "ops": ["count", "min", "max"]},
        {"name": "gdp", "ops": ["argmin", "argmax"]}
      ]
    })).to.be.true;

    expect(validate({ 
      "type": "facet",
      "groupby": ["country"],
      "summarize": [
        {"name": "medals", "ops": ["count", "min", "max"], "as": ["c", "m1", "m2"]},
        {"name": "gdp", "ops": ["argmin", "argmax"]}
      ]
    })).to.be.true;

    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "facet" })).to.be.false;
    expect(validate({ 
      "type": "facet",
      "groupby": "country",
      "summarize": {
        "medals": ["count", "min", "max"],
        "gdp": ["argmin", "argmax"]
      }
    })).to.be.false;
    expect(validate({ 
      "type": "facet",
      "groupby": ["country"],
      "summarize": {
        "medals": 1,
        "gdp": ["argmin", "argmax"]
      }
    })).to.be.false;
    expect(validate({ 
      "type": "facet",
      "groupby": ["country"],
      "summarize": {
        "medals": ["count", "min", "max", "foo"],
        "gdp": ["argmin", "argmax"]
      }
    })).to.be.false;
    expect(validate({ 
      "type": "facet",
      "groupby": ["country"],
      "summarize": [
        {"name": 1, "ops": ["argmin", "argmax"]}
      ]
    })).to.be.false;
    expect(validate({ 
      "type": "facet",
      "groupby": ["country"],
      "summarize": [
        {"name": "gdp", "ops": ["argmin", "argmax", "foo"]}
      ]
    })).to.be.false;
    expect(validate({ 
      "type": "facet",
      "groupby": ["country"],
      "summarize": [
        {"name": "gdp", "ops": ["argmin", "argmax"], "foo": "bar"}
      ]
    })).to.be.false;

  });
});