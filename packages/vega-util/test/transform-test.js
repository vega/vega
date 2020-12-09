var tape = require('tape'),
    vega = require('../');

function equal(a1, a2) {
  return a1.length === a2.length &&
    a1.every((d, i) => Math.abs(d - a2[i]) < 1e-10);
}

tape('panLinear pans a domain linearly', t => {
  const domain = [0, 1];
  t.ok(equal(vega.panLinear(domain, -1), [1, 2]));
  t.ok(equal(vega.panLinear(domain, +1), [-1, 0]));
  t.end();
});

tape('panLog pans a domain logarithmically', t => {
  const domain = [1, 10];
  t.ok(equal(vega.panLog(domain, -1), [10, 100]));
  t.ok(equal(vega.panLog(domain, +1), [0.1, 1]));
  t.end();
});

tape('panPow pans a domain along a power scale', t => {
  const domain = [4, 16];
  t.ok(equal(vega.panPow(domain, -1, 0.5), [16, 36]));
  t.ok(equal(vega.panPow(domain, +1, 0.5), [0, 4]));
  t.end();
});

tape('panSymlog pans a domain along a symlog scale', t => {
  const domain = [0, 1];
  t.ok(equal(vega.panSymlog(domain, -1, 1), [1, 3]));
  t.ok(equal(vega.panSymlog(domain, +1, 1), [-1, 0]));
  t.end();
});

tape('zoomLinear zooms a domain linearly', t => {
  const domain = [0, 1];
  t.ok(equal(vega.zoomLinear(domain, null, 2.0), [-0.5, 1.5]));
  t.ok(equal(vega.zoomLinear(domain, null, 0.5), [0.25, 0.75]));
  t.ok(equal(vega.zoomLinear(domain, 0.5,  2.0), [-0.5, 1.5]));
  t.ok(equal(vega.zoomLinear(domain, 0.5,  0.5), [0.25, 0.75]));
  t.end();
});

tape('zoomLog zooms a domain logarithmically', t => {
  t.ok(equal(vega.zoomLog([1, 100],  null, 2.0), [0.1, 1000]));
  t.ok(equal(vega.zoomLog([1, 1000], null, 1/3), [10, 100]));
  t.ok(equal(vega.zoomLog([1, 100],  10,  2.0), [0.1, 1000]));
  t.ok(equal(vega.zoomLog([1, 1000], Math.exp(Math.log(1000)/2),  1/3), [10, 100]));
  t.end();
});

tape('zoomPow zooms a domain along a power scale', t => {
  t.ok(equal(vega.zoomPow([4, 16], null, 2.0, 0.5), [1, 25]));
  t.ok(equal(vega.zoomPow([4, 25], null, 1/3, 0.5), [9, 16]));
  t.ok(equal(vega.zoomPow([4, 16], 9, 2.0, 0.5), [1, 25]));
  t.ok(equal(vega.zoomPow([4, 25], 12.25, 1/3, 0.5), [9, 16]));
  t.end();
});

tape('zoomSymlog zooms a domain along a symlog scale', t => {
  t.ok(equal(vega.zoomSymlog([-1, 1], null, 2.0, 1), [-3, 3]));
  t.ok(equal(vega.zoomSymlog([-3, 3], null, 0.5, 1), [-1, 1]));
  t.ok(equal(vega.zoomSymlog([ 0, 1], null, 3.0, 1), [-1, 3]));
  t.ok(equal(vega.zoomSymlog([-1, 3], null, 1/3, 1), [ 0, 1]));
  t.end();
});
