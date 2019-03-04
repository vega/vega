var util = require('vega-util'), vega = require('vega-dataflow'), vs = require('vega-scale'), encode = require('../');

function scale(params) {
  var df = new vega.Dataflow(),
      s = df.add(encode.scale, params),
      e = false;
  df.error = (_ => e = _);
  df.run();
  return e ? util.error(e) : s.value;
}

test('Scale respects domain configuration', function() {
  var s, params = {
    type: 'linear',
    domain: [1, 9.5]
  };

  // test zero inclusion
  s = scale(params);
  expect(s.domain()).toEqual([0, 9.5]);
  s = scale(util.extend({zero: true}, params));
  expect(s.domain()).toEqual([0, 9.5]);
  s = scale(util.extend({zero: false}, params));
  expect(s.domain()).toEqual([1, 9.5]);

  // test nice domain
  s = scale(util.extend({nice: true}, params));
  expect(s.domain()).toEqual([0, 10]);

  // test domain min/max
  s = scale(util.extend({domainMin: -1, domainMax: 10}, params));
  expect(s.domain()).toEqual([-1, 10]);

  // domain min overrides zero
  s = scale(util.extend({zero: true, domainMin: 0.5, domainMax: 10}, params));
  expect(s.domain()).toEqual([0.5, 10]);

  // test domain mid
  s = scale(util.extend({domainMid: 5}, params));
  expect(s.domain()).toEqual([0, 5, 9.5]);

  // test domain raw
  s = scale(util.extend({domainRaw: [2, 11]}, params));
  expect(s.domain()).toEqual([2, 11]);
});

test('Scale respects domain padding', function() {
  var d;

  // test linear scale padding
  d = scale({
    type: 'linear',
    domain: [5, 95],
    range: [0, 100],
    padding: 5,
    zero: false
  }).domain();
  expect(d).toEqual([0, 100]);

  // test log scale padding
  d = scale({
    type: 'log',
    domain: [1, 10],
    range: [0, 60],
    padding: 20,
    zero: false
  }).domain();
  expect(Math.abs(d[0] - 0.1) < 1e-8).toBeTruthy();
  expect(Math.abs(d[1] - 100) < 1e-8).toBeTruthy();

  // test sqrt scale padding
  d = scale({
    type: 'sqrt',
    domain: [2*2, 3*3],
    range: [0, 60],
    padding: 20,
    zero: false
  }).domain();
  expect(Math.abs(d[0] - 1*1) < 1e-8).toBeTruthy();
  expect(Math.abs(d[1] - 4*4) < 1e-8).toBeTruthy();

  // test power scale padding
  d = scale({
    type: 'pow',
    exponent: 1/3,
    domain: [2*2*2, 3*3*3],
    range: [0, 60],
    padding: 20,
    zero: false
  }).domain();
  expect(Math.abs(d[0] - 1*1*1) < 1e-8).toBeTruthy();
  expect(Math.abs(d[1] - 4*4*4) < 1e-8).toBeTruthy();
});

test('Ordinal scale respects domainImplicit', function() {
  var s, params = {
    type: 'ordinal',
    domain: [],
    range: ['a', 'b', 'c']
  };

  s = scale(params);
  expect(s('foo')).toBe(undefined);
  expect(s('bar')).toBe(undefined);
  expect(s('foo')).toBe(undefined);

  s = scale(util.extend({domainImplicit: false}, params));
  expect(s('foo')).toBe(undefined);
  expect(s('bar')).toBe(undefined);
  expect(s('foo')).toBe(undefined);

  s = scale(util.extend({domainImplicit: true}, params));
  expect(s('foo')).toBe('a');
  expect(s('bar')).toBe('b');
  expect(s('foo')).toBe('a');
});

test('Scale respects range configuration', function() {
  var s, params = {
    type: 'linear',
    domain: [0, 10],
    range: [0, 10]
  };

  // round
  s = scale(params);
  expect(s(0.5)).toBe(0.5);
  s = scale(util.extend({round: true}, params));
  expect(s(0.5)).toBe(1);

  // reverse
  s = scale(util.extend({reverse: true}, params));
  expect(s.range()).toEqual([10, 0]);

  // rangeStep
  params = {
    type: 'band',
    domain: ['a', 'b', 'c'],
    rangeStep: 20,
    padding: 0
  };
  s = scale(params);
  expect(s.range()).toEqual([0, 60]);
  expect(s.bandwidth()).toBe(20);

  s = expect(function() {
    scale(util.extend({}, params, {type: 'linear'}));
  }).toThrow();
});

test('Scale respects range color schemes', function() {
  var s, u, v;

  // performs scheme lookup
  s = scale({type: 'ordinal', scheme: 'category10'});
  expect(s.range().length).toBe(10);

  // throws on invalid scheme
  expect(function() {
    scale({type: 'ordinal', scheme: 'foobarbaz'});
  }).toThrow();
  expect(function() {
    scale({type: 'sequential', scheme: 'foobarbaz'});
  }).toThrow();

  // handles interpolating schemes and extents
  s = scale({type: 'sequential', scheme: 'viridis'});
  u = s.interpolator();
  expect(typeof u).toBe('function');

  s = scale({type: 'sequential', scheme: 'viridis', schemeExtent: [0.2, 0.9]});
  v = s.interpolator();
  expect(typeof v).toBe('function');
  expect(v(0)).toBe(u(0.2));
  expect(v(1)).toBe(u(0.9));

  s = scale({type: 'sequential', scheme: 'viridis', schemeExtent: [0.2, 0.9], reverse: true});
  v = s.interpolator();
  expect(typeof v).toBe('function');
  expect(v(0)).toBe(u(0.9));
  expect(v(1)).toBe(u(0.2));

  // generate interpolator as needed
  s = scale({type: 'sequential', range: ['#000', '#f00']});
  v = s.interpolator();
  expect(typeof v).toBe('function');
  expect(v(0)).toBe('rgb(0, 0, 0)');
  expect(v(1)).toBe('rgb(255, 0, 0)');

  // quantize to provided scheme count
  s = scale({type: 'quantize', scheme: 'viridis', schemeCount: 3});
  v = s.range();
  expect(v.length).toBe(3);
  expect(v[0]).toBe(u(1/4));
  expect(v[1]).toBe(u(2/4));
  expect(v[2]).toBe(u(3/4));
});

test('Scale warns for zero in log domain', function() {
  function logScale(domain) {
    return function() {
      var df = new vega.Dataflow(), e;
      df.warn = (_ => e = _);
      df.add(encode.scale, {type: 'log', domain: domain});
      df.run();
      if (e) util.error(e);
    };
  }

  expect(logScale([0, 1])).toThrow();
  expect(logScale([-1, 0])).toThrow();
  expect(logScale([-1, 1])).toThrow();
  expect(logScale([1, 0, 2])).toThrow();
  expect(logScale([1, 2])).not.toThrow();
  expect(logScale([-2, -1])).not.toThrow();
});

test('Scale infers scale key from type, domain, and range', function() {
  function key(params) {
    const df = new vega.Dataflow(),
          s = df.add(encode.scale, params);
    df.run();
    return s.value.type;
  }

  // numeric domain scales should adapt
  [vs.Linear, vs.Log, vs.Pow, vs.Sqrt, vs.Symlog].forEach(function(st) {
    expect(key({type: st, domain:[0,1], range:[0,1]})).toBe(st);
    expect(key({type: st, domain:[0,1], range:[true,false]})).toBe(st);

    // direct color range specification
    expect(key({type: st, domain:[0,1], range:['blue','red']})).toBe(`${vs.Sequential}-${st}`);
    expect(key({type: st, domain:[0,1,2], range:['blue','red']})).toBe(`${vs.Diverging}-${st}`);
    expect(key({type: st, domain:[0,1,2,3], range:['blue','red']})).toBe(st);

    // color scheme range specification
    expect(key({type: st, domain:[0,1], scheme:'blues'})).toBe(`${vs.Sequential}-${st}`);
    expect(key({type: st, domain:[0,1,2], scheme:'blues'})).toBe(`${vs.Diverging}-${st}`);
    expect(key({type: st, domain:[0,1,2,3], scheme:'blues'})).toBe(st);
  });

  // temporal domain scales should not adapt
  [vs.Time, vs.UTC].forEach(function(st) {
    const t0 = new Date(2010, 0, 1),
          t1 = new Date(2011, 0, 1),
          t2 = new Date(2012, 0, 1),
          t3 = new Date(2013, 0, 1);

    expect(key({type: st, domain:[t0,t1], range:[0,1]})).toBe(st);
    expect(key({type: st, domain:[t0,t1], range:[true,false]})).toBe(st);

    // direct color range specification
    expect(key({type: st, domain:[t0,t1], range:['blue','red']})).toBe(st);
    expect(key({type: st, domain:[t0,t1,t2], range:['blue','red']})).toBe(st);
    expect(key({type: st, domain:[t0,t1,t2,t3], range:['blue','red']})).toBe(st);

    // color scheme range specification
    expect(key({type: st, domain:[t0,t1], scheme:'blues'})).toBe(st);
    expect(key({type: st, domain:[t0,t1,t2], scheme:'blues'})).toBe(st);
    expect(key({type: st, domain:[t0,t1,t2,t3], scheme:'blues'})).toBe(st);
  });

  // sequential should work for backwards compatibility
  const st = vs.Sequential;
  expect(key({type: st, domain:[0,1], range:['blue','red']})).toBe(`${st}-${vs.Linear}`);
  expect(key({type: st, domain:[0,1], scheme:'blues'})).toBe(`${st}-${vs.Linear}`);
});
