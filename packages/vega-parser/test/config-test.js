import tape from 'tape';
import { mergeConfig } from 'vega-util';
import { config } from '../index.js';

tape('Config generates defaults', t => {
  const c = config();

  t.equal(c.autosize, 'pad');
  t.equal(c.style.point.shape, 'circle');

  t.end();
});

tape('Config overrides with extended defaults', t => {
  const as = {type: 'pad', resize: 'true'};

  const c = mergeConfig(
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
