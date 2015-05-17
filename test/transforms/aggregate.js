var dl = require('datalib');

describe('Aggregate', function() {

  describe('Flat', function() {
    var values = [
      {"x": 1,  "y": 28}, {"x": 2,  "y": 55},
      {"x": 3,  "y": 43}, {"x": 4,  "y": 91},
      {"x": 5,  "y": 81}, {"x": 6,  "y": 53},
      {"x": 7,  "y": 19}, {"x": 8,  "y": 87},
      {"x": 9,  "y": 52}, {"x": 10, "y": 48},
      {"x": 11, "y": 24}, {"x": 12, "y": 49},
      {"x": 13, "y": 87}, {"x": 14, "y": 66},
      {"x": 15, "y": 17}, {"x": 16, "y": 27},
      {"x": 17, "y": 68}, {"x": 18, "y": 16},
      {"x": 19, "y": 49}, {"x": 20, "y": 15}
    ];

    var spec = {
      "data": [{
        "name": "table",
        "values": values,
        "transform": [{"type": "aggregate", "summarize": [{
          "name": "y", 
          "ops": ["count", "sum", "min", "max"]
        }]}]
      }]
    };

    it('should compute summaries', function(done) {
      parseSpec(spec, function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            count = values.length,
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            vals = values.map(function(d) { return d.y }).sort(),
            min = vals[0],
            max = vals[vals.length-1];

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('count_y', values.length);
        expect(data[0]).to.have.property('sum_y', sum);
        expect(data[0]).to.have.property('min_y', min);
        expect(data[0]).to.have.property('max_y', max);


        done();
      }, modelFactory);
    });

    // Assume other measures are being tested in datalib.
    it('should handle renamed output', function(done) {
      var s = dl.duplicate(spec);
      s.data[0].transform[0].summarize[0].as = ["a", "b", "c", "d"];

      parseSpec(s, function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            count = values.length,
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            vals = values.map(function(d) { return d.y }).sort(),
            min = vals[0],
            max = vals[vals.length-1];

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('a', count);
        expect(data[0]).to.have.property('b', sum);
        expect(data[0]).to.have.property('c', min);
        expect(data[0]).to.have.property('d', max);

        done();
      }, modelFactory);
    });

    it('should handle streaming adds', function(done) {
      parseSpec(spec, function(model) {
        var a1 = {x: 21, y: 21},
            a2 = {x: 22, y: 95},
            a3 = {x: 23, y: 47};

        values.push(a1, a2, a3);
        model.data('table').insert(a1).insert(a2).insert(a3).fire();

        var ds = model.data('table'),
            data = ds.values(),
            count = values.length,
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            vals = values.map(function(d) { return d.y }).sort(),
            min = vals[0],
            max = vals[vals.length-1];

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('count_y', count);
        expect(data[0]).to.have.property('sum_y', sum);
        expect(data[0]).to.have.property('min_y', min);
        expect(data[0]).to.have.property('max_y', max);

        done();
      }, modelFactory);
    });

    it('should handle streaming rems', function(done) {
      parseSpec(spec, function(model) {
        values = values.filter(function(d) { return d.y < 50 });
        model.data('table').remove(function(d) { return d.y >= 50 }).fire();

        var ds = model.data('table'),
            data = ds.values(),
            count = values.length,
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            vals = values.map(function(d) { return d.y }).sort(),
            min = vals[0],
            max = vals[vals.length-1];

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('count_y', count);
        expect(data[0]).to.have.property('sum_y', sum);
        expect(data[0]).to.have.property('min_y', min);
        expect(data[0]).to.have.property('max_y', max);

        done();
      }, modelFactory);
    });
  });

  describe('Grouped', function() {
    var values = [
      {"country":"US", "state": "washington", "area": 12, "population": 3},
      {"country":"US", "state": "california", "area": 13, "population": 12},
      {"country":"US", "state": "new york", "area": 3, "population": 7},
      {"country":"Canada", "state": "british columbia", "area": 4, "population": 4},
      {"country":"Canada", "state": "yukon", "area": 3, "population": 2}
    ];

    var spec = {
      "data": [{
        "name": "table",
        "values": values,
        "transform": [{"type": "aggregate", "groupby": "country",
          "summarize": [{"name": "area", "ops": ["sum", "count"]}, {"name": "population", "ops": ["sum"]}]}]
      }]
    };

    it('should calculate multiple aggregations', function(done) {
      parseSpec(spec, function(model) {
        var ds = model.data('table'),
            data = ds.values();

        expect(data).to.have.length(2);

        expect(data[0]).to.have.property('country', 'US');
        expect(data[0]).to.have.property('sum_area', 28);
        expect(data[0]).to.have.property('count_area', 3);
        expect(data[0]).to.have.property('sum_population', 22);

        expect(data[1]).to.have.property('country', 'Canada');
        expect(data[1]).to.have.property('sum_area', 7);
        expect(data[1]).to.have.property('count_area', 2);
        expect(data[1]).to.have.property('sum_population', 6);

        done();
      }, modelFactory);
    });

    it('should handle signals', function(done) {
      var s = util.duplicate(spec);
      s.signals = [{"name": "field", "init": "area"}, {"name": "ops", "init": ["sum", "count"]}];
      s.data[0].transform[0].summarize = [{"name": {"signal": "field"}, "ops": {"signal": "ops"}}];

      parseSpec(s, function(model) {
        var ds = model.data('table'),
            data = ds.values();

        expect(data).to.have.length(2);

        expect(data[0]).to.have.property('country', 'US');
        expect(data[0]).to.have.property('sum_area', 28);
        expect(data[0]).to.have.property('count_area', 3);

        expect(data[1]).to.have.property('country', 'Canada');
        expect(data[1]).to.have.property('sum_area', 7);
        expect(data[1]).to.have.property('count_area', 2);

        model.signal('field').value('population').fire();
        data = ds.values();

        expect(data).to.have.length(2);

        expect(data[0]).to.have.property('country', 'US');
        expect(data[0]).to.have.property('sum_population', 22);
        expect(data[0]).to.have.property('count_population', 3);

        expect(data[1]).to.have.property('country', 'Canada');
        expect(data[1]).to.have.property('sum_population', 6);
        expect(data[1]).to.have.property('count_population', 2);        

        done();
      }, modelFactory);
    });
  });



  it.skip('should calculate stats on facets', function(done) {
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
        "transform": [{
          "type": "facet",
          "keys": [{"field": "country"}],
          "transform": [{
            "type": "aggregate",
            "summarize": [{
              "name": "count",
              "ops": ["min", "max", "median", "stdevp", "stdev",
                      "varp", "var", "avg", "sum", "count"]}],
            }]
        }]
      }]
    };

    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          data = ds.values();

      expect(data).to.have.length(2);

      expect(data[0]).to.have.property('key', 'US');
      expect(data[0]).to.have.property('count_min', 12);
      expect(data[0]).to.have.property('count_max', 15);
      expect(data[0]).to.have.property('count_median', 13);
      expect(data[0]).to.have.property('count_sum', 40);
      expect(data[0]).to.have.property('count_count', 3);

      expect(data[1]).to.have.property('key', 'Canada');
      expect(data[1]).to.have.property('count_min', 3);
      expect(data[1]).to.have.property('count_max', 5);
      expect(data[1]).to.have.property('count_median', 4);
      expect(data[1]).to.have.property('count_sum', 12);
      expect(data[1]).to.have.property('count_count', 3);

      done();
    }, modelFactory);
  });

  it('should handle filtered tuples');

});