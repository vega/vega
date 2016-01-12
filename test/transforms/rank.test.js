var dl = require('datalib'),
    EPSILON = 1e-15;

describe('Rank', function() {

  var spec = function(rank) {
    return {
      data: [{
        name: "table",
        values: [
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
        ],
        transform: [
          {type: 'sort', by: 'y'},
          dl.extend({type: 'rank'}, rank)
        ]
      }]
    };
  }

  it('should compute sorted rank', function(done) {
    parseSpec(spec(), modelFactory, function(error, model) {
      if (error) return done(error);

      var ds = model.data('table'),
          data = ds.values(),
          i, len;

      expect(data).to.have.length(20);
      for(i=1, len=data.length; i<len; ++i) {
        expect(data[i].y).to.be.at.least(data[i-1].y);
        expect(data[i].rank).to.equal(i+1);
      }

      done();
    });
  });

  it('should support custom min', function(done) {
    parseSpec(spec({min: 3}), modelFactory, function(error, model) {
      if (error) return done(error);

      var ds = model.data('table'),
          data = ds.values(),
          i, len;

      expect(data).to.have.length(20);
      for(i=1, len=data.length; i<len; ++i) {
        expect(data[i].y).to.be.at.least(data[i-1].y);
        expect(data[i].rank).to.equal(i+3);
      }

      done();
    });
  });

  it('should support custom step', function(done) {
    parseSpec(spec({step: 2}), modelFactory, function(error, model) {
      if (error) return done(error);

      var ds = model.data('table'),
          data = ds.values(),
          i, len;

      expect(data).to.have.length(20);
      for(i=1, len=data.length; i<len; ++i) {
        expect(data[i].y).to.be.at.least(data[i-1].y);
        expect(data[i].rank).to.equal(1+2*i);
      }

      done();
    });
  });

  it('should support custom min+step', function(done) {
    parseSpec(spec({min: 3, step: 2}), modelFactory, function(error, model) {
      if (error) return done(error);

      var ds = model.data('table'),
          data = ds.values(),
          i, len;

      expect(data).to.have.length(20);
      for(i=1, len=data.length; i<len; ++i) {
        expect(data[i].y).to.be.at.least(data[i-1].y);
        expect(data[i].rank).to.equal(3+2*i);
      }

      done();
    });
  });

  it('should normalize', function(done) {
    parseSpec(spec({normalize: true}), modelFactory, function(error, model) {
      if (error) return done(error);

      var ds = model.data('table'),
          data = ds.values(),
          len  = data.length,
          step = 1/len,
          i = 1;

      expect(data).to.have.length(20);
      for(; i<len; ++i) {
        expect(data[i].y).to.be.at.least(data[i-1].y);
        expect(data[i].rank).to.be.closeTo(i*step, EPSILON);
      }

      done();
    });
  });

  it('should validate against the schema', function() {
    var schema = schemaPath(transforms.rank.schema),
        validate = validator(schema);

    expect(validate({ "type": "rank" })).to.be.true;
    expect(validate({ "type": "rank", "min": 0 })).to.be.true;
    expect(validate({ "type": "rank", "min": 2 })).to.be.true;
    expect(validate({ "type": "rank", "min": {"signal": "min_sig"} })).to.be.true;
    expect(validate({ "type": "rank", "step": 2 })).to.be.true;
    expect(validate({ "type": "rank", "step": {"signal": "step_sig"} })).to.be.true;
    expect(validate({ "type": "rank", "normalize": true })).to.be.true;
    expect(validate({ "type": "rank", "normalize": false })).to.be.true;
    expect(validate({ "type": "rank", "normalize": {"signal": "norm_sig"} })).to.be.true;
    expect(validate({ "type": "rank", "output": {"rank": "idx"} })).to.be.true;

    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "rank", "min": "min_sig" })).to.be.false;
    expect(validate({ "type": "rank", "step": 0 })).to.be.false;
    expect(validate({ "type": "rank", "step": "step_sg" })).to.be.false;
    expect(validate({ "type": "rank", "normalize": "hello" })).to.be.false;
    expect(validate({ "type": "rank", "output": {"foo": "bar"} })).to.be.false;
    expect(validate({ "type": "rank", "foo": "bar" })).to.be.false;
  });


});