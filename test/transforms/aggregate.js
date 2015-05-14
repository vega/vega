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

    function spec(meas) {
      return {
        "data": [{
          "name": "table",
          "values": values,
          "transform": [{"type": "aggregate", "fields": [{"name": "y", "ops": meas}]}]
        }]
      };
    }

    it('should calculate count', function(done) {
      parseSpec(spec(['count']), function(model) {
        var ds = model.data('table'),
            data = ds.values();

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('y_count', values.length);

        done();
      }, modelFactory);
    });

    it('should calculate sum', function(done) {
      parseSpec(spec(['sum']), function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0);

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('y_sum', sum);

        done();
      }, modelFactory);
    });

    it('should calculate avg', function(done) {
      parseSpec(spec(['avg']), function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            count = values.length,
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count;

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('y_avg', avg);

        done();
      }, modelFactory);
    });

    it('should calculate var', function(done) {
      parseSpec(spec(['var']), function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            count = values.length,
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count,
            variance = values.reduce(function(variance, d) { return variance + Math.pow(d.y-avg, 2); }, 0),
            vr = variance/(count-1);

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('y_var', vr);

        done();
      }, modelFactory);
    });

    it('should calculate varp', function(done) {
      parseSpec(spec(['varp']), function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            count = values.length,
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count,
            variance = values.reduce(function(variance, d) { return variance + Math.pow(d.y-avg, 2); }, 0),
            varp = variance/count;

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('y_varp', varp);

        done();
      }, modelFactory);
    });

    it('should calculate stdev', function(done) {
      parseSpec(spec(['stdev']), function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            count = values.length,
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count,
            variance = values.reduce(function(variance, d) { return variance + Math.pow(d.y-avg, 2); }, 0),
            stdev = Math.sqrt(variance/(count-1));

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('y_stdev', stdev);

        done();
      }, modelFactory);
    });

    it('should calculate stdevp', function(done) {
      parseSpec(spec(['stdevp']), function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            count = values.length,
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count,
            variance = values.reduce(function(variance, d) { return variance + Math.pow(d.y-avg, 2); }, 0),
            stdevp = Math.sqrt(variance/count);

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('y_stdevp', stdevp);

        done();
      }, modelFactory);
    });

    it('should calculate median', function(done) {
      parseSpec(spec(['median']), function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            vals = values.map(function(d) { return d.y }).sort(),
            half = ~~(vals.length/2),
            median = vals.length % 2 ? vals[half] : 0.5 * (vals[half-1] + vals[half]);

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('y_median', median);

        done();
      }, modelFactory);
    });

    it('should calculate min', function(done) {
      parseSpec(spec(['min']), function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            vals = values.map(function(d) { return d.y }).sort(),
            min = vals[0];

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('y_min', min);

        done();
      }, modelFactory);
    });

    it('should calculate max', function(done) {
      parseSpec(spec(['max']), function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            vals = values.map(function(d) { return d.y }).sort(),
            max = vals[vals.length-1];

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('y_max', max);

        done();
      }, modelFactory);
    });

    it('should handle renamed output', function(done) {
      var s = spec(['min', 'max', 'median', 'stdevp', 'stdev', 'varp', 'var', 'avg', 'sum', 'count']);
      s.data[0].transform[0].output = {
          "count":    "a_count",
          "avg":      "a_avg",
          "min":      "a_min",
          "max":      "a_max",
          "sum":      "a_sum",
          "mean":     "a_mean",
          "var":      "a_var",
          "stdev":    "a_stdev",
          "varp":     "a_varp",
          "stdevp":   "a_stdevp",
          "median":   "a_median"
        };

      parseSpec(s, function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            count = values.length,
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count,
            variance = values.reduce(function(variance, d) { return variance + Math.pow(d.y-avg, 2); }, 0),
            vr = variance/(count-1),
            varp = variance/count,
            stdev = Math.sqrt(vr),
            stdevp = Math.sqrt(varp),
            vals = values.map(function(d) { return d.y }).sort(),
            half = ~~(count/2),
            median = count % 2 ? vals[half] : (vals[half-1] + vals[half])/2,
            min = vals[0],
            max = vals[vals.length-1];

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('y_a_count', count);
        expect(data[0]).to.have.property('y_a_sum', sum);
        expect(data[0]).to.have.property('y_a_avg', avg);
        expect(data[0]).to.have.property('y_a_var', vr);
        expect(data[0]).to.have.property('y_a_varp', varp);
        expect(data[0]).to.have.property('y_a_stdev', stdev);
        expect(data[0]).to.have.property('y_a_stdevp', stdevp);
        expect(data[0]).to.have.property('y_a_median', median);
        expect(data[0]).to.have.property('y_a_min', min);
        expect(data[0]).to.have.property('y_a_max', max);

        done();
      }, modelFactory);
    });

    it('should handle streaming adds', function(done) {
      parseSpec(spec(['min', 'max', 'median', 'stdevp', 'stdev', 'varp', 'var', 'avg', 'sum', 'count']), function(model) {
        var a1 = {x: 21, y: 21},
            a2 = {x: 22, y: 95},
            a3 = {x: 23, y: 47};

        values.push(a1, a2, a3);
        model.data('table').insert(a1).insert(a2).insert(a3).fire();

        var ds = model.data('table'),
            data = ds.values(),
            count = values.length,
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count,
            variance = values.reduce(function(variance, d) { return variance + Math.pow(d.y-avg, 2); }, 0),
            vr = variance/(count-1),
            varp = variance/count,
            stdev = Math.sqrt(vr),
            stdevp = Math.sqrt(varp),
            vals = values.map(function(d) { return d.y }).sort(),
            half = ~~(count/2),
            median = count % 2 ? vals[half] : (vals[half-1] + vals[half])/2,
            min = vals[0],
            max = vals[vals.length-1];

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('y_count', count);
        expect(data[0]).to.have.property('y_sum', sum);
        expect(data[0]).to.have.property('y_avg', avg);
        expect(data[0]).to.have.property('y_var', vr);
        expect(data[0]).to.have.property('y_varp', varp);
        expect(data[0]).to.have.property('y_stdev', stdev);
        expect(data[0]).to.have.property('y_stdevp', stdevp);
        expect(data[0]).to.have.property('y_median', median);
        expect(data[0]).to.have.property('y_min', min);
        expect(data[0]).to.have.property('y_max', max);

        done();
      }, modelFactory);
    });

    it('should handle streaming rems', function(done) {
      parseSpec(spec(['min', 'max', 'median', 'stdevp', 'stdev', 'varp', 'var', 'avg', 'sum', 'count']), function(model) {
        values = values.filter(function(d) { return d.y < 50 });
        model.data('table').remove(function(d) { return d.y >= 50 }).fire();

        var ds = model.data('table'),
            data = ds.values(),
            count = values.length,
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count,
            variance = values.reduce(function(variance, d) { return variance + Math.pow(d.y-avg, 2); }, 0),
            vr = variance/(count-1),
            varp = variance/count,
            stdev = Math.sqrt(vr),
            stdevp = Math.sqrt(varp),
            vals = values.map(function(d) { return d.y }).sort(),
            half = ~~(count/2),
            median = count % 2 ? vals[half] : (vals[half-1] + vals[half])/2,
            min = vals[0],
            max = vals[vals.length-1];

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('y_count', count);
        expect(data[0]).to.have.property('y_sum', sum);
        expect(data[0]).to.have.property('y_avg', avg);
        expect(data[0]).to.have.property('y_var', vr);
        expect(data[0]).to.have.property('y_varp', varp);
        expect(data[0]).to.have.property('y_stdev', stdev);
        expect(data[0]).to.have.property('y_stdevp', stdevp);
        expect(data[0]).to.have.property('y_median', median);
        expect(data[0]).to.have.property('y_min', min);
        expect(data[0]).to.have.property('y_max', max);

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
        "transform": [{"type": "aggregate", "group_by": "country",
          "fields": [{"name": "area", "ops": ["sum", "count"]}, {"name": "population", "ops": ["sum"]}]}]
      }]
    };

    it('should calculate multiple aggregations', function(done) {
      parseSpec(spec, function(model) {
        var ds = model.data('table'),
            data = ds.values();

        expect(data).to.have.length(2);

        expect(data[0]).to.have.property('country', 'US');
        expect(data[0]).to.have.property('area_sum', 28);
        expect(data[0]).to.have.property('area_count', 3);
        expect(data[0]).to.have.property('population_sum', 22);

        expect(data[1]).to.have.property('country', 'Canada');
        expect(data[1]).to.have.property('area_sum', 7);
        expect(data[1]).to.have.property('area_count', 2);
        expect(data[1]).to.have.property('population_sum', 6);

        done();
      }, modelFactory);
    });

    it('should handle signals', function(done) {
      var s = util.duplicate(spec);
      s.signals = [{"name": "field", "init": "area"}, {"name": "ops", "init": ["sum", "count"]}];
      s.data[0].transform[0].fields = [{"name": {"signal": "field"}, "ops": {"signal": "ops"}}];

      parseSpec(s, function(model) {
        var ds = model.data('table'),
            data = ds.values();

        expect(data).to.have.length(2);

        expect(data[0]).to.have.property('country', 'US');
        expect(data[0]).to.have.property('area_sum', 28);
        expect(data[0]).to.have.property('area_count', 3);

        expect(data[1]).to.have.property('country', 'Canada');
        expect(data[1]).to.have.property('area_sum', 7);
        expect(data[1]).to.have.property('area_count', 2);

        model.signal('field').value('population').fire();
        data = ds.values();

        expect(data).to.have.length(2);

        expect(data[0]).to.have.property('country', 'US');
        expect(data[0]).to.have.property('population_sum', 22);
        expect(data[0]).to.have.property('population_count', 3);

        expect(data[1]).to.have.property('country', 'Canada');
        expect(data[1]).to.have.property('population_sum', 6);
        expect(data[1]).to.have.property('population_count', 2);        

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
            "fields": [{
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