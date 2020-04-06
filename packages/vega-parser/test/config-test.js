const tape = require('tape');
const util = require('vega-util');
const config = require('../').config;

tape('Config generates defaults', function (t) {
  const c = config();

  t.equal(c.autosize, 'pad');
  t.equal(c.style.point.shape, 'circle');

  t.end();
});

tape('Config overrides with extended defaults', function (t) {
  const as = {type: 'pad', resize: 'true'};

  const c = util.mergeConfig(
    config(),
    {autosize: as},
    {style: {point: {shape: 'triangle-right'}}},
    {style: {point: {shape: 'square'}}},
    {axis: {gridDash: [3, 5, 3]}},
    {axis: {gridDash: [2, 2]}}
  );

  t.deepEqual(c.autosize, as);
  t.equal(c.style.point.shape, 'square');
  t.deepEqual(c.axis.gridDash, [2, 2]);

  t.end();
});
