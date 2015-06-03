describe('Sort', function() {
  var values = [
    {"x": 1,  "y": 28}, {"x": 1,  "y": 55},
    {"x": 1,  "y": 43}, {"x": 1,  "y": 91},
    {"x": 5,  "y": 81}, {"x": 6,  "y": 53},
    {"x": 7,  "y": 19}, {"x": 8,  "y": 87},
    {"x": 9,  "y": 52}, {"x": 10, "y": 48},
    {"x": 10, "y": 24}, {"x": 10, "y": 49},
    {"x": 10, "y": 87}, {"x": 10, "y": 66},
    {"x": 15, "y": 17}, {"x": 16, "y": 27},
    {"x": 17, "y": 68}, {"x": 18, "y": 16},
    {"x": 19, "y": 49}, {"x": 19, "y": 15}
  ];

  var spec = {
    "signals": [
      {"name": "sortBy0", "init": "-x"},
      {"name": "sortBy1", "init": "y"}
    ],

    "data": [{
      "name": "table",
      "values": values,
      "transform": [{"type": "sort", "by": {"field": "y"}}]
    }]
  }

  it('should sort asc w/a single static fieldName', function(done) {
    parseSpec(spec, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(20);
      for(i=1, len=data.length; i<len; ++i) {
        expect(data[i].y).to.be.at.least(data[i-1].y)
      }

      done();
    }, modelFactory);
  });

  it('should sort desc w/a single static fieldName', function(done) {
    var s = util.duplicate(spec);
    s.data[0].transform[0].by.field = "-y";

    parseSpec(s, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(20);
      for(i=1, len=data.length; i<len; ++i) {
        expect(data[i-1].y).to.be.at.least(data[i].y)
      }

      done();
    }, modelFactory);
  });

  it('should sort w/a single signal', function(done) {
    var s = util.duplicate(spec);
    s.data[0].transform[0].by = {"signal": "sortBy1"};

    parseSpec(s, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(20);
      for(i=1, len=data.length; i<len; ++i) {
        expect(data[i].y).to.be.at.least(data[i-1].y)
      }

      model.signal('sortBy1').value('-y').fire();
      data = ds.values();
      expect(data).to.have.length(20);
      for(i=1, len=data.length; i<len; ++i) {
        expect(data[i-1].y).to.be.at.least(data[i].y)
      }

      done();
    }, modelFactory);
  }); 

  it('should sort w/multiple static fieldNames', function(done) {
    var s = util.duplicate(spec);
    s.data[0].transform[0].by = [{"field": "-x"}, {"field": "y"}];

    parseSpec(s, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(20);
      for(i=1, len=data.length; i<len; ++i) {
        expect(data[i-1].x).to.be.at.least(data[i].x);
        if(data[i-1].x === data[i].x) {
          expect(data[i].y).to.be.at.least(data[i-1].y);
        }
      }

      done();
    }, modelFactory);
  }); 

  it('should sort w/multiple signals', function(done) {
    var s = util.duplicate(spec);
    s.data[0].transform[0].by = [{"signal": "sortBy0"}, {"signal": "sortBy1"}];

    parseSpec(s, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(20);
      for(i=1, len=data.length; i<len; ++i) {
        expect(data[i-1].x).to.be.at.least(data[i].x);
        if(data[i-1].x === data[i].x) {
          expect(data[i].y).to.be.at.least(data[i-1].y);
        }
      }

      model.signal('sortBy0').value('x').fire();
      data = ds.values();
      expect(data).to.have.length(20);
      for(i=1, len=data.length; i<len; ++i) {
        expect(data[i].x).to.be.at.least(data[i-1].x);
        if(data[i-1].x === data[i].x) {
          expect(data[i].y).to.be.at.least(data[i-1].y);
        }
      }

      model.signal('sortBy1').value('-y').fire();
      data = ds.values();
      expect(data).to.have.length(20);
      for(i=1, len=data.length; i<len; ++i) {
        expect(data[i].x).to.be.at.least(data[i-1].x);
        if(data[i-1].x === data[i].x) {
          expect(data[i-1].y).to.be.at.least(data[i].y);
        }
      }

      done();
    }, modelFactory);
  });   

  it('should sort w/mixed fieldNames+signals', function(done) {
    var s = util.duplicate(spec);
    s.data[0].transform[0].by = [{"field": "-x"}, {"signal": "sortBy1"}];

    parseSpec(s, function(model) {
      var ds = model.data('table'),
          data = ds.values(), 
          i, len, d;

      expect(data).to.have.length(20);
      for(i=1, len=data.length; i<len; ++i) {
        expect(data[i-1].x).to.be.at.least(data[i].x);
        if(data[i-1].x === data[i].x) {
          expect(data[i].y).to.be.at.least(data[i-1].y);
        }
      }

      model.signal('sortBy1').value('-y').fire();
      data = ds.values();
      expect(data).to.have.length(20);
      for(i=1, len=data.length; i<len; ++i) {
        expect(data[i-1].x).to.be.at.least(data[i].x);
        if(data[i-1].x === data[i].x) {
          expect(data[i-1].y).to.be.at.least(data[i].y);
        }
      }

      done();
    }, modelFactory);
  });   

});