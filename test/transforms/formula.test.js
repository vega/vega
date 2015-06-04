describe('Formula', function() {
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
        "transform": [{"type": "formula", "field": "z", "expr": "datum.x + datum.y"}]
      }] 
    }, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(20);
      for(i=0, len=data.length; i<len; ++i) {
        d = data[i];
        expect(d.z).to.equal(d.x + d.y);
      }
      expect(ds._output.fields).to.have.key('z');

      done();
    }, modelFactory);
  });

  it('should work w/signals in expr', function(done) {
    parseSpec({ 
      "signals":[{"name": "multipler", "init": 2}],

      "data": [{ 
        "name": "table", 
        "values": values,
        "transform": [{"type": "formula", "field": "z", "expr": "multipler * (datum.x + datum.y)"}]
      }] 
    }, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(20);
      for(i=0, len=data.length; i<len; ++i) {
        d = data[i];
        expect(d.z).to.equal(2 * (d.x + d.y));
      }
      expect(ds._output.fields).to.have.key('z');

      model.signal('multipler').value(4).fire();
      data = ds.values();
      expect(data).to.have.length(20);
      for(i=0, len=data.length; i<len; ++i) {
        d = data[i];
        expect(d.z).to.equal(4 * (d.x + d.y));
      }
      expect(ds._output.fields).to.have.key('z');

      model.signal('multipler').value(15).fire();
      data = ds.values();
      expect(data).to.have.length(20);
      for(i=0, len=data.length; i<len; ++i) {
        d = data[i];
        expect(d.z).to.equal(15 * (d.x + d.y));
      }
      expect(ds._output.fields).to.have.key('z');

      done();
    }, modelFactory);
  });
});
