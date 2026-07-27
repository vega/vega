import tape from 'tape';
import point, {ctmPoint, rectPoint} from '../src/util/point.js';

function element(rect, props) {
  return {
    getBoundingClientRect: () => rect,
    ...props
  };
}

tape('point maps untransformed elements identically to rect math', t => {
  const el = element(
    {left: 10, top: 20, width: 100, height: 50},
    {offsetWidth: 100, offsetHeight: 50, clientLeft: 0, clientTop: 0}
  );
  t.deepEqual(point({clientX: 60, clientY: 45}, el), [50, 25]);
  t.deepEqual(point({clientX: 10, clientY: 20}, el), [0, 0]);
  t.end();
});

tape('point compensates for CSS scale via rect vs offset size', t => {
  const el = element(
    {left: 10, top: 20, width: 50, height: 25},
    {offsetWidth: 100, offsetHeight: 50, clientLeft: 0, clientTop: 0}
  );
  t.deepEqual(point({clientX: 35, clientY: 30}, el), [50, 20]);
  t.deepEqual(point({clientX: 60, clientY: 45}, el), [100, 50]);
  t.end();
});

tape('point falls back to unit scale for zero or undefined offset size', t => {
  const rect = {left: 10, top: 20, width: 100, height: 50};
  const zero = element(rect, {offsetWidth: 0, offsetHeight: 0, clientLeft: 0, clientTop: 0});
  t.deepEqual(point({clientX: 60, clientY: 45}, zero), [50, 25]);

  const undef = element(rect, {clientLeft: 0, clientTop: 0});
  t.deepEqual(point({clientX: 60, clientY: 45}, undef), [50, 25]);
  t.end();
});

tape('point subtracts borders after unscaling', t => {
  const el = element(
    {left: 10, top: 20, width: 50, height: 25},
    {offsetWidth: 100, offsetHeight: 50, clientLeft: 2, clientTop: 3}
  );
  t.deepEqual(point({clientX: 35, clientY: 30}, el), [48, 17]);
  t.end();
});

tape('point applies the inverse screen CTM for SVG elements', t => {
  const el = element(
    {left: 0, top: 0, width: 0, height: 0},
    {getScreenCTM: () => ({a: 2, b: 0, c: 0, d: 2, e: 10, f: 20})}
  );
  t.deepEqual(point({clientX: 110, clientY: 120}, el), [50, 50]);

  const translated = element(
    {left: 0, top: 0, width: 0, height: 0},
    {getScreenCTM: () => ({a: 0.5, b: 0, c: 0, d: 0.25, e: 8, f: 6})}
  );
  t.deepEqual(point({clientX: 33, clientY: 16}, translated), [50, 40]);
  t.end();
});

tape('point falls back to rect math for null or singular CTM', t => {
  const rect = {left: 10, top: 20, width: 100, height: 50};
  const nullCTM = element(rect, {
    offsetWidth: 100, offsetHeight: 50, clientLeft: 0, clientTop: 0,
    getScreenCTM: () => null
  });
  t.deepEqual(point({clientX: 60, clientY: 45}, nullCTM), [50, 25]);

  const singular = element(rect, {
    offsetWidth: 100, offsetHeight: 50, clientLeft: 0, clientTop: 0,
    getScreenCTM: () => ({a: 0, b: 0, c: 0, d: 0, e: 0, f: 0})
  });
  t.deepEqual(point({clientX: 60, clientY: 45}, singular), [50, 25]);
  t.end();
});

tape('ctmPoint returns null for missing or singular matrices', t => {
  t.equal(ctmPoint({clientX: 0, clientY: 0}, null), null);
  t.equal(ctmPoint({clientX: 0, clientY: 0}, {a: 1, b: 2, c: 2, d: 4, e: 0, f: 0}), null);
  t.end();
});

tape('rectPoint uses a caller-provided rect', t => {
  const el = {offsetWidth: 200, offsetHeight: 100, clientLeft: 1, clientTop: 1};
  const rect = {left: 5, top: 5, width: 100, height: 50};
  t.deepEqual(rectPoint({clientX: 55, clientY: 30}, el, rect), [99, 49]);
  t.end();
});
