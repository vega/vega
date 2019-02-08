var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    vs = require('vega-scale'),
    encode = require('../');

function scale(params) {
  var df = new vega.Dataflow(),
      s = df.add(encode.scale, params),
      e = false;
  df.error = (_ => e = _);
  df.run();
  return e ? util.error(e) : s.value;
}

tape('Scale respects domain configuration', function(test) {
  var s, params = {
    type: 'linear',
    domain: [1, 9.5]
  };

  // test zero inclusion
  s = scale(params);
  test.deepEqual(s.domain(), [0, 9.5]);
  s = scale(util.extend({zero: true}, params));
  test.deepEqual(s.domain(), [0, 9.5]);
  s = scale(util.extend({zero: false}, params));
  test.deepEqual(s.domain(), [1, 9.5]);

  // test nice domain
  s = scale(util.extend({nice: true}, params));
  test.deepEqual(s.domain(), [0, 10]);

  // test domain min/max
  s = scale(util.extend({domainMin: -1, domainMax: 10}, params));
  test.deepEqual(s.domain(), [-1, 10]);

  // domain min overrides zero
  s = scale(util.extend({zero: true, domainMin: 0.5, domainMax: 10}, params));
  test.deepEqual(s.domain(), [0.5, 10]);

  // test domain mid
  s = scale(util.extend({domainMid: 5}, params));
  test.deepEqual(s.domain(), [0, 5, 9.5]);

  // test domain raw
  s = scale(util.extend({domainRaw: [2, 11]}, params));
  test.deepEqual(s.domain(), [2, 11]);

  test.end();
});

tape('Scale respects domain padding', function(test) {
  var d;

  // test linear scale padding
  d = scale({
    type: 'linear',
    domain: [5, 95],
    range: [0, 100],
    padding: 5,
    zero: false
  }).domain();
  test.deepEqual(d, [0, 100]);

  // test log scale padding
  d = scale({
    type: 'log',
    domain: [1, 10],
    range: [0, 60],
    padding: 20,
    zero: false
  }).domain();
  test.ok(Math.abs(d[0] - 0.1) < 1e-8);
  test.ok(Math.abs(d[1] - 100) < 1e-8);

  // test sqrt scale padding
  d = scale({
    type: 'sqrt',
    domain: [2*2, 3*3],
    range: [0, 60],
    padding: 20,
    zero: false
  }).domain();
  test.ok(Math.abs(d[0] - 1*1) < 1e-8);
  test.ok(Math.abs(d[1] - 4*4) < 1e-8);

  // test power scale padding
  d = scale({
    type: 'pow',
    exponent: 1/3,
    domain: [2*2*2, 3*3*3],
    range: [0, 60],
    padding: 20,
    zero: false
  }).domain();
  test.ok(Math.abs(d[0] - 1*1*1) < 1e-8);
  test.ok(Math.abs(d[1] - 4*4*4) < 1e-8);

  test.end();
});

tape('Ordinal scale respects domainImplicit', function(test) {
  var s, params = {
    type: 'ordinal',
    domain: [],
    range: ['a', 'b', 'c']
  };

  s = scale(params);
  test.equal(s('foo'), undefined);
  test.equal(s('bar'), undefined);
  test.equal(s('foo'), undefined);

  s = scale(util.extend({domainImplicit: false}, params));
  test.equal(s('foo'), undefined);
  test.equal(s('bar'), undefined);
  test.equal(s('foo'), undefined);

  s = scale(util.extend({domainImplicit: true}, params));
  test.equal(s('foo'), 'a');
  test.equal(s('bar'), 'b');
  test.equal(s('foo'), 'a');

  test.end();
});

tape('Scale respects range configuration', function(test) {
  var s, params = {
    type: 'linear',
    domain: [0, 10],
    range: [0, 10]
  };

  // round
  s = scale(params);
  test.equal(s(0.5), 0.5);
  s = scale(util.extend({round: true}, params));
  test.equal(s(0.5), 1);

  // reverse
  s = scale(util.extend({reverse: true}, params));
  test.deepEqual(s.range(), [10, 0]);

  // rangeStep
  params = {
    type: 'band',
    domain: ['a', 'b', 'c'],
    rangeStep: 20,
    padding: 0
  };
  s = scale(params);
  test.deepEqual(s.range(), [0, 60]);
  test.equal(s.bandwidth(), 20);

  s = test.throws(function() {
    scale(util.extend({}, params, {type: 'linear'}));
  });

  test.end();
});

tape('Scale respects range color schemes', function(test) {
  var s, u, v;

  // performs scheme lookup
  s = scale({type: 'ordinal', scheme: 'category10'});
  test.equal(s.range().length, 10);

  // throws on invalid scheme
  test.throws(function() {
    scale({type: 'ordinal', scheme: 'foobarbaz'});
  });
  test.throws(function() {
    scale({type: 'sequential', scheme: 'foobarbaz'});
  });

  // handles interpolating schemes and extents
  s = scale({type: 'sequential', scheme: 'viridis'});
  u = s.interpolator();
  test.equal(typeof u, 'function');

  s = scale({type: 'sequential', scheme: 'viridis', schemeExtent: [0.2, 0.9]});
  v = s.interpolator();
  test.equal(typeof v, 'function');
  test.equal(v(0), u(0.2));
  test.equal(v(1), u(0.9));

  s = scale({type: 'sequential', scheme: 'viridis', schemeExtent: [0.2, 0.9], reverse: true});
  v = s.interpolator();
  test.equal(typeof v, 'function');
  test.equal(v(0), u(0.9));
  test.equal(v(1), u(0.2));

  // generate interpolator as needed
  s = scale({type: 'sequential', range: ['#000', '#f00']});
  v = s.interpolator();
  test.equal(typeof v, 'function');
  test.equal(v(0), 'rgb(0, 0, 0)');
  test.equal(v(1), 'rgb(255, 0, 0)');

  // quantize to provided scheme count
  s = scale({type: 'quantize', scheme: 'viridis', schemeCount: 3});
  v = s.range();
  test.equal(v.length, 3);
  test.equal(v[0], u(1/4));
  test.equal(v[1], u(2/4));
  test.equal(v[2], u(3/4));

  test.end();
});

tape('Scale warns for zero in log domain', function(test) {
  function logScale(domain) {
    return function() {
      var df = new vega.Dataflow(), e;
      df.warn = (_ => e = _);
      df.add(encode.scale, {type: 'log', domain: domain});
      df.run();
      if (e) util.error(e);
    };
  }

  test.throws(logScale([0, 1]));
  test.throws(logScale([-1, 0]));
  test.throws(logScale([-1, 1]));
  test.throws(logScale([1, 0, 2]));
  test.doesNotThrow(logScale([1, 2]));
  test.doesNotThrow(logScale([-2, -1]));

  test.end();
});

tape('Scale infers scale key from type, domain, and range', function(test) {
  function key(params) {
    const df = new vega.Dataflow(),
          s = df.add(encode.scale, params);
    df.run();
    return s.value.type;
  }

  // numeric domain scales should adapt
  [vs.Linear, vs.Log, vs.Pow, vs.Sqrt, vs.Symlog].forEach(function(t) {
    test.equal(key({type: t, domain:[0,1], range:[0,1]}), t);
    test.equal(key({type: t, domain:[0,1], range:[true,false]}), t);

    // direct color range specification
    test.equal(key({type: t, domain:[0,1], range:['blue','red']}), `${vs.Sequential}-${t}`);
    test.equal(key({type: t, domain:[0,1,2], range:['blue','red']}), `${vs.Diverging}-${t}`);
    test.equal(key({type: t, domain:[0,1,2,3], range:['blue','red']}), t);

    // color scheme range specification
    test.equal(key({type: t, domain:[0,1], scheme:'blues'}), `${vs.Sequential}-${t}`);
    test.equal(key({type: t, domain:[0,1,2], scheme:'blues'}), `${vs.Diverging}-${t}`);
    test.equal(key({type: t, domain:[0,1,2,3], scheme:'blues'}), t);
  });

  // temporal domain scales should not adapt
  [vs.Time, vs.UTC].forEach(function(t) {
    const t0 = new Date(2010, 0, 1),
          t1 = new Date(2011, 0, 1),
          t2 = new Date(2012, 0, 1),
          t3 = new Date(2013, 0, 1);

    test.equal(key({type: t, domain:[t0,t1], range:[0,1]}), t);
    test.equal(key({type: t, domain:[t0,t1], range:[true,false]}), t);

    // direct color range specification
    test.equal(key({type: t, domain:[t0,t1], range:['blue','red']}), t);
    test.equal(key({type: t, domain:[t0,t1,t2], range:['blue','red']}), t);
    test.equal(key({type: t, domain:[t0,t1,t2,t3], range:['blue','red']}), t);

    // color scheme range specification
    test.equal(key({type: t, domain:[t0,t1], scheme:'blues'}), t);
    test.equal(key({type: t, domain:[t0,t1,t2], scheme:'blues'}), t);
    test.equal(key({type: t, domain:[t0,t1,t2,t3], scheme:'blues'}), t);
  });

  // sequential should work for backwards compatibility
  const t = vs.Sequential;
  test.equal(key({type: t, domain:[0,1], range:['blue','red']}), `${t}-${vs.Linear}`);
  test.equal(key({type: t, domain:[0,1], scheme:'blues'}), `${t}-${vs.Linear}`);

  test.end();
});
