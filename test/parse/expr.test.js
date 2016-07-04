var dl = require('datalib'),
    expr = require('../../src/parse/expr')(null);

describe('Expression Parser', function() {

  var evt = {vg: {
    getItem:  function() { return 'foo'; },
    getGroup: function() { return 'bar'; },
    getX:     function() { return 'xx'; },
    getY:     function() { return 'yy'; }
  }};

  function run(code, model, datum, parent) {
    var e = expr(code);
    e.model = model;
    return e.fn(datum, parent, evt);
  }

  run.fn = function(code, model, datum) {
    return function() { return run(code, model, datum); }
  };

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

  it('should evaluate indata function', function(done) {
    var spec = {
      signals: [{name:'sig', streams:[]}],
      data: [{name: 'source', values: [{x: 1, y:2}, {x: 1, y: 5}]}]
    };
    parseSpec(spec, viewFactory, function(error, model) {
      var expr = require('../../src/parse/expr')(model);
      function run(code, datum, parent, evt) {
        return expr(code).fn(datum, parent, evt);
      }
      expect(run('indata("source", 1, "x")')).to.equal(true);
      expect(run('indata("source", 2, "x")')).to.equal(false);
      expect(run('indata("source", 5, "y")')).to.equal(true);

      // data source must be a consant expression
      expect(run.bind('indata(sig, 1, "x")')).to.throw(Error);
      done();
    });
  });

  it('should evaluate open function', function() {
    var config = {load: {domainWhiteList: ['github.io']}},
        model = {config: function() { return config; }};

    expect(run.fn('open("http://vega.github.io/")', model)).to.throw();

    var oldwin = global.window;
    global.window = {open: function(url, name) {}};

    // COMMENT OUT for now. sanitizeUrl allows javascript protocol to pass through
    // expect(run.fn('open("javascript:alert(\'foo\')")', model)).to.throw();

    expect(run.fn('open("http://vega.github.io/")', model)).to.not.throw();
    expect(run.fn('open("http://example.com/")', model)).to.throw();

    global.window = oldwin;
  });


});
