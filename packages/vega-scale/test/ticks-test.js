import tape from 'tape';
import { validTicks } from '../index.js';
import { tickValues } from '../index.js';
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
