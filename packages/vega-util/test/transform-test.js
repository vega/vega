var vega = require('../');

function equal(a1, a2) {
  return a1.length === a2.length &&
    a1.every(function(d, i) { return Math.abs(d - a2[i]) < 1e-10; });
}

test('panLinear pans a domain linearly', function() {
  var domain = [0, 1];
  expect(equal(vega.panLinear(domain, -1), [1, 2])).toBeTruthy();
  expect(equal(vega.panLinear(domain, +1), [-1, 0])).toBeTruthy();
});

test('panLog pans a domain logarithmically', function() {
  var domain = [1, 10];
  expect(equal(vega.panLog(domain, -1), [10, 100])).toBeTruthy();
  expect(equal(vega.panLog(domain, +1), [0.1, 1])).toBeTruthy();
});

test('panPow pans a domain along a power scale', function() {
  var domain = [4, 16];
  expect(equal(vega.panPow(domain, -1, 0.5), [16, 36])).toBeTruthy();
  expect(equal(vega.panPow(domain, +1, 0.5), [0, 4])).toBeTruthy();
});

test('panSymlog pans a domain along a symlog scale', function() {
  var domain = [0, 1];
  expect(equal(vega.panSymlog(domain, -1, 1), [1, 3])).toBeTruthy();
  expect(equal(vega.panSymlog(domain, +1, 1), [-1, 0])).toBeTruthy();
});

test('zoomLinear zooms a domain linearly', function() {
  var domain = [0, 1];
  expect(equal(vega.zoomLinear(domain, null, 2.0), [-0.5, 1.5])).toBeTruthy();
  expect(equal(vega.zoomLinear(domain, null, 0.5), [0.25, 0.75])).toBeTruthy();
  expect(equal(vega.zoomLinear(domain, 0.5,  2.0), [-0.5, 1.5])).toBeTruthy();
  expect(equal(vega.zoomLinear(domain, 0.5,  0.5), [0.25, 0.75])).toBeTruthy();
});

test('zoomLog zooms a domain logarithmically', function() {
  expect(equal(vega.zoomLog([1, 100],  null, 2.0), [0.1, 1000])).toBeTruthy();
  expect(equal(vega.zoomLog([1, 1000], null, 1/3), [10, 100])).toBeTruthy();
  expect(equal(vega.zoomLog([1, 100],  10,  2.0), [0.1, 1000])).toBeTruthy();
  expect(
    equal(vega.zoomLog([1, 1000], Math.exp(Math.log(1000)/2),  1/3), [10, 100])
  ).toBeTruthy();
});

test('zoomPow zooms a domain along a power scale', function() {
  expect(equal(vega.zoomPow([4, 16], null, 2.0, 0.5), [1, 25])).toBeTruthy();
  expect(equal(vega.zoomPow([4, 25], null, 1/3, 0.5), [9, 16])).toBeTruthy();
  expect(equal(vega.zoomPow([4, 16], 9, 2.0, 0.5), [1, 25])).toBeTruthy();
  expect(equal(vega.zoomPow([4, 25], 12.25, 1/3, 0.5), [9, 16])).toBeTruthy();
});

test('zoomSymlog zooms a domain along a symlog scale', function() {
  expect(equal(vega.zoomSymlog([-1, 1], null, 2.0, 1), [-3, 3])).toBeTruthy();
  expect(equal(vega.zoomSymlog([-3, 3], null, 0.5, 1), [-1, 1])).toBeTruthy();
  expect(equal(vega.zoomSymlog([ 0, 1], null, 3.0, 1), [-1, 3])).toBeTruthy();
  expect(equal(vega.zoomSymlog([-1, 3], null, 1/3, 1), [ 0, 1])).toBeTruthy();
});
