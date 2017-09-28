var tape = require('tape'),
    vega = require('../');

function equal(a1, a2) {
  return a1.length === a2.length &&
    a1.every(function(d, i) { return Math.abs(d - a2[i]) < 1e-10; });
}

tape('panLinear pans a domain linearly', function(test) {
  var domain = [0, 1];
  test.ok(equal(vega.panLinear(domain, -1), [1, 2]));
  test.ok(equal(vega.panLinear(domain, +1), [-1, 0]));
  test.end();
});

tape('panLog pans a domain logarithmically', function(test) {
  var domain = [1, 10];
  test.ok(equal(vega.panLog(domain, -1), [10, 100]));
  test.ok(equal(vega.panLog(domain, +1), [0.1, 1]));
  test.end();
});

tape('panPow pans a domain along a power scale', function(test) {
  var domain = [4, 16];
  test.ok(equal(vega.panPow(domain, -1, 0.5), [16, 36]));
  test.ok(equal(vega.panPow(domain, +1, 0.5), [0, 4]));
  test.end();
});

tape('zoomLinear zooms a domain linearly', function(test) {
  var domain = [0, 1];
  test.ok(equal(vega.zoomLinear(domain, null, 2.0), [-0.5, 1.5]));
  test.ok(equal(vega.zoomLinear(domain, null, 0.5), [0.25, 0.75]));
  test.ok(equal(vega.zoomLinear(domain, 0.5,  2.0), [-0.5, 1.5]));
  test.ok(equal(vega.zoomLinear(domain, 0.5,  0.5), [0.25, 0.75]));
  test.end();
});

tape('zoomLog zooms a domain logarithmically', function(test) {
  test.ok(equal(vega.zoomLog([1, 100],  null, 2.0), [0.1, 1000]));
  test.ok(equal(vega.zoomLog([1, 1000], null, 1/3), [10, 100]));
  test.ok(equal(vega.zoomLog([1, 100],  10,  2.0), [0.1, 1000]));
  test.ok(equal(vega.zoomLog([1, 1000], Math.exp(Math.log(1000)/2),  1/3), [10, 100]));
  test.end();
});

tape('zoomPow zooms a domain along a power scale', function(test) {
  test.ok(equal(vega.zoomPow([4, 16], null, 2.0, 0.5), [1, 25]));
  test.ok(equal(vega.zoomPow([4, 25], null, 1/3, 0.5), [9, 16]));
  test.ok(equal(vega.zoomPow([4, 16], 9, 2.0, 0.5), [1, 25]));
  test.ok(equal(vega.zoomPow([4, 25], 12.25, 1/3, 0.5), [9, 16]));
  test.end();
});
