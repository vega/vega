import tape from 'tape';
import { scale, tickCount, tickValues, validTicks } from '../index.js';
import {timeInterval} from 'vega-time';

tape('validTicks uses count correctly', t => {
  const data = [0, 1, 2, 3, 4, 5, 6, 7];

  const identity = function(x) { return x; };
  identity.range = function() { return [0, 10]; };

  const t1 = validTicks(identity, data, 5);
  t.deepEqual(t1, [0, 2, 4, 6]);

  // don't change ticks if count is large
  const t2 = validTicks(identity, data, 100);
  t.deepEqual(t2, data);

  // special case for low number of ticks
  const t3 = validTicks(identity, data, 3);
  t.deepEqual(t3, [0, 7]);

  // validTicks ignores interval function
  const t4 = validTicks(identity, data, timeInterval('hour'));
  t.deepEqual(t4, data);

  // single tick should pass through
  const t5 = validTicks(identity, [1], 5);
  t.deepEqual(t5, [1]);

  t.end();
});

tape('tickValues uses scale and count correctly', t => {
  const data = [0, 1, 2, 3, 4, 5, 6, 7];

  const scaleWithBins = function(x) { return x; };
  scaleWithBins.range = function() { return [0, 10]; };
  scaleWithBins.bins = [0, 2, 4, 6, 8];

  // Use all bins if within specified count
  const t1 = tickValues(scaleWithBins, 5);
  t.deepEqual(t1, [0, 2, 4, 6, 8]);

  // Filter bins if too many
  const t2 = tickValues(scaleWithBins, 4);
  t.deepEqual(t2, [0, 4, 8]);

  const scaleWithTicks = function(x) { return x; };
  scaleWithTicks.range = function() { return [0, 10]; };
  scaleWithTicks.ticks = function(count) { return Array.from(Array(count).keys()); };

  // Use scale.ticks with specified count if available
  const t3 = tickValues(scaleWithTicks, 3);
  t.deepEqual(t3, [0, 1, 2]);

  const scale = function(x) { return x; };
  scale.range = function() { return [0, 10]; };
  scale.domain = function() { return data; };

  // Use full domain if no bins or ticks
  const t4 = tickValues(scale, 5);
  t.deepEqual(t4, data);

  t.end();
});

tape('tickCount and tickValues enforce minStep', t => {
  const linear = scale('linear');

  // no minStep leaves the count unchanged
  const s0 = linear().domain([0, 12]);
  t.equal(tickCount(s0, 10), 10);
  t.equal(tickCount(s0, 10, null), 10);
  t.equal(tickCount(s0, 10, 0), 10);
  t.deepEqual(tickValues(s0, tickCount(s0, 10)), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

  // issue #4163: count capping alone yields step 2 < minStep 3
  const c1 = tickCount(s0, 10, 3);
  t.equal(c1, 3);
  t.deepEqual(tickValues(s0, c1), [0, 5, 10]);

  const s1 = linear().domain([0, 1]);
  const c2 = tickCount(s1, 10, 1);
  t.equal(c2, 1);
  t.deepEqual(tickValues(s1, c2), [0, 1]);

  const s2 = linear().domain([0, 10]);
  const c3 = tickCount(s2, 10, 3);
  t.equal(c3, 3);
  t.deepEqual(tickValues(s2, c3), [0, 5, 10]);

  // minStep larger than the domain span degenerates to a single count
  const c4 = tickCount(s0, 10, 20);
  t.equal(c4, 1);
  t.deepEqual(tickValues(s0, c4), [0, 10]);

  // descending domain
  const s3 = linear().domain([12, 0]);
  const c5 = tickCount(s3, 10, 3);
  t.equal(c5, 3);
  t.deepEqual(tickValues(s3, c5), [10, 5, 0]);

  // non-numeric domain passes through unchanged
  const s4 = scale('band')().domain(['a', 'b', 'c']).range([0, 100]);
  t.deepEqual(tickValues(s4, tickCount(s4, 5, 1)), ['a', 'b', 'c']);

  t.end();
});

tape('tickCount does not enforce minStep for log and time scales', t => {
  // log scales retain count capping only
  const s0 = scale('log')().domain([1, 100]);
  const c0 = tickCount(s0, 10, 10);
  t.equal(c0, 10);
  t.ok(tickValues(s0, c0).length > 0);

  // temporal scales retain count capping only
  const s1 = scale('utc')().domain([Date.UTC(2020, 0, 1), Date.UTC(2020, 0, 2)]);
  const c1 = tickCount(s1, 10, 1000 * 60 * 60 * 7);
  t.equal(c1, 4);
  t.deepEqual(
    tickValues(s1, c1).map(d => +d),
    [0, 6, 12, 18, 24].map(h => Date.UTC(2020, 0, 1, h))
  );

  t.end();
});
