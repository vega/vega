var tape = require('tape'),
    config = require('../').config;

tape('Config generates defaults', function(t) {
  var c = config();

  t.equal(c.autosize, 'pad');
  t.equal(c.style.point.shape, 'circle');

  t.end();
});

tape('Config overrides with extended defaults', function(t) {
  var as = {type: 'pad', resize: 'true'};

  var c = config([
    {autosize: as},
    {style: {point: {shape: 'triangle-right'}}},
    {style: {point: {shape: 'square'}}},
    {axis: {gridDash: [3, 5, 3]}},
    {axis: {gridDash: [2, 2]}},
  ]);

  t.deepEqual(c.autosize, as);
  t.equal(c.style.point.shape, 'square');
  t.deepEqual(c.axis.gridDash, [2, 2]);

  t.end();
});
