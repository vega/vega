describe('Filter', function() {
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

  it('should work w/a static expr', function(done) {
    parseSpec({ 
      "data": [{ 
        "name": "table", 
        "values": values,
        "transform": [{"type": "filter", "test": "d.y > 45"}]
      }] 
    }, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          filtered = values.filter(function(d) { return d.y > 45 }), 
          i, len;

      expect(data.length).to.be.above(0).and.equal(filtered.length);
      for(i=0, len=data.length; i<len; ++i) expect(data[i].y).to.be.above(45);

      done();
    }, viewFactory);
  });

  it('should work w/signals in expr', function(done) {
    parseSpec({ 
      "signals":[{"name": "above", "init": 45}],

      "data": [{ 
        "name": "table", 
        "values": values,
        "transform": [{"type": "filter", "test": "d.y > above"}]
      }] 
    }, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          filtered = values.filter(function(d) { return d.y > 45 }), 
          i, len;

      expect(data.length).to.be.above(0).and.equal(filtered.length);
      for(i=0, len=data.length; i<len; ++i) expect(data[i].y).to.be.above(45);

      model.signal('above').value(15).fire();
      filtered = values.filter(function(d) { return d.y > 15 });
      data = ds.values();
      expect(data.length).to.be.above(0).and.equal(filtered.length);
      for(i=0, len=data.length; i<len; ++i) expect(data[i].y).to.be.above(15);

      model.signal('above').value(30).fire();
      filtered = values.filter(function(d) { return d.y > 30 });
      data = ds.values();
      expect(data.length).to.be.above(0).and.equal(filtered.length);
      for(i=0, len=data.length; i<len; ++i) expect(data[i].y).to.be.above(30);

      done();
    }, viewFactory);
  });
});