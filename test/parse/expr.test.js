var dl = require('datalib'),
    expr = require('../../src/parse/expr');

describe('Expression Parser', function() {

  var evt = {vg: {
    item:     function() { return 'foo'; },
    getGroup: function() { return 'bar'; },
    getX:     function() { return 'xx'; },
    getY:     function() { return 'yy'; }
  }};

  function run(code, model, datum, signals) {
    return expr(code).fn(model, datum, evt, signals);
  }

  it('should evaluate event functions', function() {
    expect(run('eventItem()')).to.equal('foo');
    expect(run('eventGroup()')).to.equal('bar');
    expect(run('eventX()')).to.equal('xx');
    expect(run('eventY()')).to.equal('yy');
  });

  it('should evaluate scale functions', function(done) {
    var spec = {"data": [], "scales": [
      {name:"y", type:"linear", domain:[1,5], range:[0,1], zero:false}
    ]};
    parseSpec(spec, viewFactory, function(error, model) {
      var group = model.scene().items[0],
          y = group.scale('y');
      expect(run('scale("y", 1)', model)).to.equal(y(1));
      expect(run('scale("y", 5)', model)).to.equal(y(5));
      expect(run('iscale("y", 0)', model)).to.equal(y.invert(0));
      expect(run('iscale("y", 1)', model)).to.equal(y.invert(1));
      done();
    });
  });

  it('should evaluate inrange function', function() {
    expect(run('inrange(2, 1, 3)')).to.equal(true);
    expect(run('inrange(3, 1, 3)')).to.equal(true);
    expect(run('inrange(3, 1, 3, true)')).to.equal(false);
  });

  it('should evaluate format functions', function() {
    expect(run('format(",.2f", 1200.342)')).to.equal('1,200.34');
    expect(run('timeFormat("%b %Y", datetime(2000,9))')).to.equal('Oct 2000');
    expect(run('utcFormat("%b %Y %H:%M", utc(2009,9,1,10))')).to.equal('Oct 2009 10:00');
  });

});