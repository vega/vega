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

tape('Scale respects domain configuration', t => {
  var s, params = {
    type: 'linear',
    domain: [1, 9.5]
  };

  // test zero inclusion
  s = scale(params);
  t.deepEqual(s.domain(), [0, 9.5]);
  s = scale(util.extend({zero: true}, params));
  t.deepEqual(s.domain(), [0, 9.5]);
  s = scale(util.extend({zero: false}, params));
  t.deepEqual(s.domain(), [1, 9.5]);

  // test nice domain
  s = scale(util.extend({nice: true}, params));
  t.deepEqual(s.domain(), [0, 10]);

  // test domain min/max
  s = scale(util.extend({domainMin: -1, domainMax: 10}, params));
  t.deepEqual(s.domain(), [-1, 10]);

  // domain min overrides zero
  s = scale(util.extend({zero: true, domainMin: 0.5, domainMax: 10}, params));
  t.deepEqual(s.domain(), [0.5, 10]);

  // test domain mid
  s = scale(util.extend({domainMid: 5}, params));
  t.deepEqual(s.domain(), [0, 5, 9.5]);

  // test domain raw
  s = scale(util.extend({domainRaw: [2, 11]}, params));
  t.deepEqual(s.domain(), [2, 11]);

  t.end();
});

tape('Scale respects domain padding', t => {
  let d;

  // test linear scale padding
  d = scale({
    type: 'linear',
    domain: [5, 95],
    range: [0, 100],
    padding: 5,
    zero: false
  }).domain();
  t.deepEqual(d, [0, 100]);

  // test log scale padding
  d = scale({
    type: 'log',
    domain: [1, 10],
    range: [0, 60],
    padding: 20,
    zero: false
  }).domain();
  t.ok(Math.abs(d[0] - 0.1) < 1e-8);
  t.ok(Math.abs(d[1] - 100) < 1e-8);

  // test sqrt scale padding
  d = scale({
    type: 'sqrt',
    domain: [2*2, 3*3],
    range: [0, 60],
    padding: 20,
    zero: false
  }).domain();
  t.ok(Math.abs(d[0] - 1*1) < 1e-8);
  t.ok(Math.abs(d[1] - 4*4) < 1e-8);

  // test power scale padding
  d = scale({
    type: 'pow',
    exponent: 1/3,
    domain: [2*2*2, 3*3*3],
    range: [0, 60],
    padding: 20,
    zero: false
  }).domain();
  t.ok(Math.abs(d[0] - 1*1*1) < 1e-8);
  t.ok(Math.abs(d[1] - 4*4*4) < 1e-8);

  t.end();
});

tape('Ordinal scale respects domainImplicit', t => {
  var s, params = {
    type: 'ordinal',
    domain: [],
    range: ['a', 'b', 'c']
  };

  s = scale(params);
  t.equal(s('foo'), undefined);
  t.equal(s('bar'), undefined);
  t.equal(s('foo'), undefined);

  s = scale(util.extend({domainImplicit: false}, params));
  t.equal(s('foo'), undefined);
  t.equal(s('bar'), undefined);
  t.equal(s('foo'), undefined);

  s = scale(util.extend({domainImplicit: true}, params));
  t.equal(s('foo'), 'a');
  t.equal(s('bar'), 'b');
  t.equal(s('foo'), 'a');

  t.end();
});

tape('Scale respects range configuration', t => {
  var s, params = {
    type: 'linear',
    domain: [0, 10],
    range: [0, 10]
  };

  // round
  s = scale(params);
  t.equal(s(0.5), 0.5);
  s = scale(util.extend({round: true}, params));
  t.equal(s(0.5), 1);

  // reverse
  s = scale(util.extend({reverse: true}, params));
  t.deepEqual(s.range(), [10, 0]);

  // rangeStep
  params = {
    type: 'band',
    domain: ['a', 'b', 'c'],
    rangeStep: 20,
    padding: 0
  };
  s = scale(params);
  t.deepEqual(s.range(), [0, 60]);
  t.equal(s.bandwidth(), 20);

  s = t.throws(() => {
    scale(util.extend({}, params, {type: 'linear'}));
  });

  t.end();
});

tape('Scale respects range color schemes', t => {
  var s, u, v;

  // performs scheme lookup
  s = scale({type: 'ordinal', scheme: 'category10'});
  t.equal(s.range().length, 10);

  // throws on invalid scheme
  t.throws(() => {
    scale({type: 'ordinal', scheme: 'foobarbaz'});
  });
  t.throws(() => {
    scale({type: 'sequential', scheme: 'foobarbaz'});
  });

  // handles interpolating schemes and extents
  s = scale({type: 'sequential', scheme: 'viridis'});
  u = s.interpolator();
  t.equal(typeof u, 'function');

  s = scale({type: 'sequential', scheme: 'viridis', schemeExtent: [0.2, 0.9]});
  v = s.interpolator();
  t.equal(typeof v, 'function');
  t.equal(v(0), u(0.2));
  t.equal(v(1), u(0.9));

  s = scale({type: 'sequential', scheme: 'viridis', schemeExtent: [0.2, 0.9], reverse: true});
  v = s.interpolator();
  t.equal(typeof v, 'function');
  t.equal(v(0), u(0.9));
  t.equal(v(1), u(0.2));

  // generate interpolator as needed
  s = scale({type: 'sequential', range: ['#000', '#f00']});
  v = s.interpolator();
  t.equal(typeof v, 'function');
  t.equal(v(0), 'rgb(0, 0, 0)');
  t.equal(v(1), 'rgb(255, 0, 0)');

  // quantize to provided scheme count
  s = scale({type: 'quantize', scheme: 'viridis', schemeCount: 3});
  v = s.range();
  t.equal(v.length, 3);
  t.equal(v[0], u(1/4));
  t.equal(v[1], u(2/4));
  t.equal(v[2], u(3/4));

  t.end();
});

tape('Scale warns for zero in log domain', t => {
  function logScale(domain) {
    return function() {
      var df = new vega.Dataflow(), e;
      df.warn = (_ => e = _);
      df.add(encode.scale, {type: 'log', domain: domain});
      df.run();
      if (e) util.error(e);
    };
  }

  t.throws(logScale([0, 1]));
  t.throws(logScale([-1, 0]));
  t.throws(logScale([-1, 1]));
  t.throws(logScale([1, 0, 2]));
  t.doesNotThrow(logScale([1, 2]));
  t.doesNotThrow(logScale([-2, -1]));

  t.end();
});

tape('Scale infers scale key from type, domain, and range', t => {
  function key(params) {
    const df = new vega.Dataflow(),
          s = df.add(encode.scale, params);
    df.run();
    return s.value.type;
  }

  // numeric domain scales should adapt
  [vs.Linear, vs.Log, vs.Pow, vs.Sqrt, vs.Symlog].forEach(st => {
    t.equal(key({type: st, domain:[0,1], range:[0,1]}), st);
    t.equal(key({type: st, domain:[0,1], range:[true,false]}), st);

    // direct color range specification
    t.equal(key({type: st, domain:[0,1], range:['blue','red']}), `${vs.Sequential}-${st}`);
    t.equal(key({type: st, domain:[0,1,2], range:['blue','red']}), `${vs.Diverging}-${st}`);
    t.equal(key({type: st, domain:[0,1,2,3], range:['blue','red']}), st);

    // color scheme range specification
    t.equal(key({type: st, domain:[0,1], scheme:'blues'}), `${vs.Sequential}-${st}`);
    t.equal(key({type: st, domain:[0,1,2], scheme:'blues'}), `${vs.Diverging}-${st}`);
    t.equal(key({type: st, domain:[0,1,2,3], scheme:'blues'}), st);
  });

  // temporal domain scales should not adapt
  [vs.Time, vs.UTC].forEach(st => {
    const t0 = new Date(2010, 0, 1),
          t1 = new Date(2011, 0, 1),
          t2 = new Date(2012, 0, 1),
          t3 = new Date(2013, 0, 1);

    t.equal(key({type: st, domain:[t0,t1], range:[0,1]}), st);
    t.equal(key({type: st, domain:[t0,t1], range:[true,false]}), st);

    // direct color range specification
    t.equal(key({type: st, domain:[t0,t1], range:['blue','red']}), st);
    t.equal(key({type: st, domain:[t0,t1,t2], range:['blue','red']}), st);
    t.equal(key({type: st, domain:[t0,t1,t2,t3], range:['blue','red']}), st);

    // color scheme range specification
    t.equal(key({type: st, domain:[t0,t1], scheme:'blues'}), st);
    t.equal(key({type: st, domain:[t0,t1,t2], scheme:'blues'}), st);
    t.equal(key({type: st, domain:[t0,t1,t2,t3], scheme:'blues'}), st);
  });

  // sequential should work for backwards compatibility
  const st = vs.Sequential;
  t.equal(key({type: st, domain:[0,1], range:['blue','red']}), `${st}-${vs.Linear}`);
  t.equal(key({type: st, domain:[0,1], scheme:'blues'}), `${st}-${vs.Linear}`);

  t.end();
});

tape('Scale respects bins parameter', t => {
  var bins = {start: 0, stop: 10, step: 2},
      vals = [0, 2, 4, 6, 8, 10],
      val6 = [0, 2, 4, 6],
      s;

  // generates bins array
  s = scale({type: 'linear', domain: [0, 10], bins});
  t.deepEqual(s.bins, vals);
  t.deepEqual(s.domain(), [0, 10]);

  // generates bins array clipped to domain
  s = scale({type: 'linear', domain: [0, 6], bins});
  t.deepEqual(s.bins, val6);
  t.deepEqual(s.domain(), [0, 6]);

  // infers start, stop from domain
  s = scale({type: 'linear', domain: [0, 10], bins: {step: 2}});
  t.deepEqual(s.bins, vals);
  t.deepEqual(s.domain(), [0, 10]);

  // accepts explicit bin boundaries
  s = scale({type: 'linear', domain: [0, 10], bins: val6});
  t.deepEqual(s.bins, val6);
  t.deepEqual(s.domain(), [0, 10]);

  // throws if no step parameter is defined
  t.throws(() => scale({type: 'linear', bins: {}}));

  // bin-ordinal scale copies domain to bins
  s = scale({type: 'bin-ordinal', domain: [0, 5, 10]});
  t.deepEqual(s.bins, [0, 5, 10]);
  t.deepEqual(s.domain(), [0, 5, 10]);

  // bin-ordinal scale copies bins to domain
  s = scale({type: 'bin-ordinal', bins});
  t.deepEqual(s.bins, vals);
  t.deepEqual(s.domain(), vals);

  // bin-ordinal scale copies bins to domain
  s = scale({type: 'bin-ordinal', bins: vals});
  t.deepEqual(s.bins, vals);
  t.deepEqual(s.domain(), vals);

  t.end();
});
