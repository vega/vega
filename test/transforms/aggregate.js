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

    function spec(stats) {
      return { 
        "data": [{ 
          "name": "table", 
          "values": values,
          "transform": [{"type": "aggregate", "on": "y", "stats": stats }]
        }] 
      };
    }

    it('should calculate count', function(done) {
      parseSpec(spec(['count']), function(model) {
        model.fire();

        var ds = model.data('table'),
            data = ds.values();

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('count', values.length);

        done();
      }, viewFactory);
    });

    it('should calculate sum', function(done) {
      parseSpec(spec(['sum']), function(model) {
        model.fire();

        var ds = model.data('table'),
            data = ds.values(),
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0);

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('sum', sum);

        done();
      }, viewFactory);
    });

    it('should calculate avg', function(done) {
      parseSpec(spec(['avg']), function(model) {
        model.fire();

        var ds = model.data('table'),
            data = ds.values(),
            count = values.length
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count;

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('avg', avg);

        done();
      }, viewFactory);
    });

    it('should calculate var', function(done) {
      parseSpec(spec(['var']), function(model) {
        model.fire();

        var ds = model.data('table'),
            data = ds.values(),
            count = values.length
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count,
            variance = values.reduce(function(variance, d) { return variance + Math.pow(d.y-avg, 2); }, 0),
            vr = variance/(count-1);

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('var', vr);

        done();
      }, viewFactory);
    });

    it('should calculate varp', function(done) {
      parseSpec(spec(['varp']), function(model) {
        model.fire();

        var ds = model.data('table'),
            data = ds.values(),
            count = values.length
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count,
            variance = values.reduce(function(variance, d) { return variance + Math.pow(d.y-avg, 2); }, 0),
            varp = variance/count;

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('varp', varp);

        done();
      }, viewFactory);
    });

    it('should calculate stdev', function(done) {
      parseSpec(spec(['stdev']), function(model) {
        model.fire();

        var ds = model.data('table'),
            data = ds.values(),
            count = values.length
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count,
            variance = values.reduce(function(variance, d) { return variance + Math.pow(d.y-avg, 2); }, 0),
            stdev = Math.sqrt(variance/(count-1));

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('stdev', stdev);

        done();
      }, viewFactory);
    });

    it('should calculate stdevp', function(done) {
      parseSpec(spec(['stdevp']), function(model) {
        model.fire();

        var ds = model.data('table'),
            data = ds.values(),
            count = values.length
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count,
            variance = values.reduce(function(variance, d) { return variance + Math.pow(d.y-avg, 2); }, 0),
            stdevp = Math.sqrt(variance/count);

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('stdevp', stdevp);

        done();
      }, viewFactory);
    });

    it('should calculate median', function(done) {
      parseSpec(spec(['median']), function(model) {
        model.fire();

        var ds = model.data('table'),
            data = ds.values(),
            vals = values.map(function(d) { return d.y }).sort(),
            half = ~~(vals.length/2),
            median = vals.length % 2 ? vals[half] : (vals[half-1] + vals[half])/2;

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('median', median);

        done();
      }, viewFactory);
    });

    it('should handle streaming adds', function(done) {
      parseSpec(spec(['median', 'stdevp', 'stdev', 'varp', 'var', 'avg', 'sum', 'count']), function(model) {
        var a1 = {x: 21, y: 21},
            a2 = {x: 22, y: 95},
            a3 = {x: 23, y: 47};

        model.fire();
        values.push(a1, a2, a3);
        model.data('table').add(a1).add(a2).add(a3).fire();

        var ds = model.data('table'),
            data = ds.values(),
            count = values.length
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count,
            variance = values.reduce(function(variance, d) { return variance + Math.pow(d.y-avg, 2); }, 0),
            vr = variance/(count-1),
            varp = variance/count,
            stdev = Math.sqrt(vr),
            stdevp = Math.sqrt(varp),
            vals = values.map(function(d) { return d.y }).sort(),
            half = ~~(count/2),
            median = count % 2 ? vals[half] : (vals[half-1] + vals[half])/2;

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('count', count);
        expect(data[0]).to.have.property('sum', sum);
        expect(data[0]).to.have.property('avg', avg);
        expect(data[0]).to.have.property('var', vr);
        expect(data[0]).to.have.property('varp', varp);
        expect(data[0]).to.have.property('stdev', stdev);
        expect(data[0]).to.have.property('stdevp', stdevp);
        expect(data[0]).to.have.property('median', median);

        done();
      }, viewFactory);
    });

    it('should handle streaming rems', function(done) {
      parseSpec(spec(['median', 'stdevp', 'stdev', 'varp', 'var', 'avg', 'sum', 'count']), function(model) {
        model.fire();
        values = values.filter(function(d) { return d.y < 50 });
        model.data('table').remove(function(d) { return d.y >= 50 }).fire();

        var ds = model.data('table'),
            data = ds.values(),
            count = values.length
            sum = values.reduce(function(sum, d) { return sum+d.y}, 0),
            avg = sum/count,
            variance = values.reduce(function(variance, d) { return variance + Math.pow(d.y-avg, 2); }, 0),
            vr = variance/(count-1),
            varp = variance/count,
            stdev = Math.sqrt(vr),
            stdevp = Math.sqrt(varp),
            vals = values.map(function(d) { return d.y }).sort(),
            half = ~~(count/2),
            median = count % 2 ? vals[half] : (vals[half-1] + vals[half])/2;

        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('count', count);
        expect(data[0]).to.have.property('sum', sum);
        expect(data[0]).to.have.property('avg', avg);
        expect(data[0]).to.have.property('var', vr);
        expect(data[0]).to.have.property('varp', varp);
        expect(data[0]).to.have.property('stdev', stdev);
        expect(data[0]).to.have.property('stdevp', stdevp);
        expect(data[0]).to.have.property('median', median);

        done();
      }, viewFactory);
    });

  });

  it('should set aggregates on facets');

  it('should handle filtered tuples');

});