import tape from 'tape';
import { Dataflow } from 'vega-dataflow';
import * as vs from 'vega-scale';
import { axisticks, scale } from '../index.js';

/**
 * Build a linear scale node and an axisticks node backed by it, then run the
 * dataflow.  Returns the array of tick datum objects from axisticks.value.
 *
 * `tickParams` is merged into the axisticks parameter object, so callers can
 * pass `values`, `extra`, etc.  The scale always covers [0, 10].
 */
function makeTicks(tickParams) {
  var df = new Dataflow(),
      s  = df.add(scale, { type: vs.Linear, domain: [0, 10], range: [0, 500], zero: false }),
      t  = df.add(axisticks, { scale: s, ...tickParams });
  df.run();
  return t.value;
}

tape('AxisTicks tickIndex is sequential integers starting at 0', t => {
  // Explicit values give deterministic tick count regardless of d3 heuristics.
  var ticks = makeTicks({ values: [0, 2, 4, 6, 8, 10] });

  t.equal(ticks.length, 6, 'produces 6 ticks');
  ticks.forEach((d, i) => {
    t.equal(d.tickIndex, i, `tick ${i} has tickIndex ${i}`);
  });

  t.end();
});

tape('AxisTicks fractional index field retains existing semantics', t => {
  var ticks = makeTicks({ values: [0, 5, 10] });

  t.equal(ticks.length, 3);
  t.equal(ticks[0].index, 0,   'first tick index is 0');
  t.equal(ticks[1].index, 0.5, 'middle tick index is 0.5');
  t.equal(ticks[2].index, 1,   'last tick index is 1');

  // tickIndex must not disturb the fractional index contract
  t.equal(ticks[0].tickIndex, 0, 'first tickIndex is 0');
  t.equal(ticks[1].tickIndex, 1, 'second tickIndex is 1');
  t.equal(ticks[2].tickIndex, 2, 'third tickIndex is 2');

  t.end();
});

tape('AxisTicks extra (binned-domain sentinel) tick gets tickIndex -1', t => {
  var ticks = makeTicks({ values: [0, 5, 10], extra: true });

  // Regular ticks come first; the sentinel is appended at the end.
  t.equal(ticks.length, 4, 'produces 3 regular ticks + 1 extra tick');

  var extra = ticks[ticks.length - 1];
  t.equal(extra.index, -1,     'extra tick has index -1');
  t.equal(extra.tickIndex, -1, 'extra tick has tickIndex -1');
  t.ok(extra.extra,            'extra tick has extra flag set');

  t.end();
});

tape('AxisTicks single tick avoids division-by-zero', t => {
  var ticks = makeTicks({ values: [5] });

  t.equal(ticks.length, 1);
  t.equal(ticks[0].index,     0, 'single tick index is 0 (not NaN)');
  t.equal(ticks[0].tickIndex, 0, 'single tick tickIndex is 0');

  t.end();
});
