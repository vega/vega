describe('Spec Parser', function() {

  it('should return error for null input', function(done) {
    parseSpec(null, function(error, chart) {
      expect(error).to.exist;
      done();
    })
  });

  it('should return error for undefined input', function(done) {
    parseSpec(undefined, function(error, chart) {
      expect(error).to.exist;
      done();
    })
  });

  it('should return error for boolean input', function(done) {
    parseSpec(false, function(error, chart) {
      expect(error).to.exist;
      done();
    })
  });

  it('should return error for numeric input', function(done) {
    parseSpec(1, function(error, chart) {
      expect(error).to.exist;
      done();
    })
  });

  it('should return error for invalid spec url', function(done) {
    var spec = 'h!!p://12f.3z';
    parseSpec(spec, function(error, chart) {
      expect(error).to.exist;
      done();
    })
  });

  it('should return error for invalid data url', function(done) {
    var spec = {
      data: [{name: 'table', url: 'h!!p://12f.3z'}]
    };
    parseSpec(spec, function(error, chart) {
      expect(error).to.exist;
      done();
    })
  });

  it('should return error for invalid data format', function(done) {
    var spec = {
      data: [{name: 'table', values: '!#$%^&'}]
    };
    parseSpec(spec, function(error, chart) {
      expect(error).to.exist;
      done();
    })
  });
});