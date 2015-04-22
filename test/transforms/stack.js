describe('Stack', function() {

  var EPSILON = 1e-8;

  var values = [
    {a: 1, b: 1, c: 'a'},
    {a: 1, b: 2, c: 'b'},
    {a: 1, b: 3, c: 'c'},
    {a: 2, b: 4, c: 'a'},
    {a: 2, b: 5, c: 'b'},
    {a: 2, b: 6, c: 'c'},
    {a: 3, b: 7, c: 'a'},
    {a: 3, b: 8, c: 'b'},
    {a: 3, b: 9, c: 'c'},
    {a: 3, b: 2, c: 'a'}
  ];
  
  function spec(opt) {
    var stack = {
      type: "stack",
      groupby: opt.groupby,
      sortby: opt.sortby,
      value: opt.value,
      offset: opt.offset,
      output: {start: "y2", stop: "y", mid: "cy"}
    };
    
    return {
      data: [{
        name: "table",
        values: values,
        transform: [stack]
      }]
    };
  }

  it('should perform flat stack', function(done) {
    parseSpec(spec({groupby:null, sortby:null, value:"b", offset:"zero"}),
      function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            y = [0,1,3,6,10,15,21,28,36,45,47];

        for (var i=0; i<data.length; ++i) {
          expect(data[i]).to.have.property('y2', y[i]);
          expect(data[i]).to.have.property('y', y[i+1]);
          expect(data[i]).to.have.property('cy', 0.5 * (y[i] + y[i+1]));
        }
        done();
      },
      modelFactory);
  });

  it('should perform grouped stack', function(done) {
    parseSpec(spec({groupby:["a"], sortby:null, value:"b", offset:"zero"}),
      function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            y0 = [0,1,3,  0,4, 9,  0, 7,15,24],
            y1 = [1,3,6,  4,9,15,  7,15,24,26];

        for (var i=0; i<data.length; ++i) {
          expect(data[i]).to.have.property('y2', y0[i]);
          expect(data[i]).to.have.property('y', y1[i]);
          expect(data[i]).to.have.property('cy', 0.5 * (y0[i] + y1[i]));
        }
        done();
      },
      modelFactory);
  });
  
  it('should perform grouped stack with offset center', function(done) {
    parseSpec(spec({groupby:["a"], sortby:null, value:"b", offset:"center"}),
      function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            y0 = [10,11,13,  5.5, 9.5,14.5,  0, 7,15,24],
            y1 = [11,13,16,  9.5,14.5,20.5,  7,15,24,26];

        for (var i=0; i<data.length; ++i) {
          expect(data[i]).to.have.property('y2', y0[i]);
          expect(data[i]).to.have.property('y', y1[i]);
          expect(data[i]).to.have.property('cy', 0.5 * (y0[i] + y1[i]));
        }
        done();
      },
      modelFactory);
  });

  it('should perform grouped stack with offset normalize', function(done) {
    parseSpec(spec({groupby:["a"], sortby:null, value:"b", offset:"normalize"}),
      function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            y0 = [0/6,1/6,3/6,  0/15,4/15, 9/15,  0/26, 7/26,15/26,24/26],
            y1 = [1/6,3/6,6/6,  4/15,9/15,15/15,  7/26,15/26,24/26,26/26];

        for (var i=0; i<data.length; ++i) {
          expect(data[i]).to.have.property('y2').closeTo(y0[i], EPSILON);
          expect(data[i]).to.have.property('y').closeTo(y1[i], EPSILON);
          expect(data[i]).to.have.property('cy').closeTo(0.5 * (y0[i] + y1[i]), EPSILON);
        }
        done();
      },
      modelFactory);
  });
  
  it('should perform grouped sorted stack', function(done) {
    parseSpec(spec({groupby:["a"], sortby:"c", value:"b", offset:"zero"}),
      function(model) {
        var ds = model.data('table'),
            data = ds.values(),
            y0 = [0,1,3,  0,4, 9,  0, 9,17,7],
            y1 = [1,3,6,  4,9,15,  7,17,26,9];

        for (var i=0; i<data.length; ++i) {
          expect(data[i]).to.have.property('y2', y0[i]);
          expect(data[i]).to.have.property('y', y1[i]);
          expect(data[i]).to.have.property('cy', 0.5 * (y0[i] + y1[i]));
        }
        done();
      },
      modelFactory);
  });


});