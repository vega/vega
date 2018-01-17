var tape = require('tape'),
    config = require('../').config;

tape('Config generates defaults', function(test) {
  var c = config();

  test.equal(c.autosize, 'pad');
  test.equal(c.style.point.shape, 'circle');

  test.end();
});

tape('Config overrides with extended defaults', function(test) {
  var as = {type: 'pad', resize: 'true'};

  var c = config([
    {autosize: as},
    {style: {point: {shape: 'triangle-right'}}},
    {style: {point: {shape: 'square'}}},
    {axis: {gridDash: [3, 5, 3]}},
    {axis: {gridDash: [2, 2]}},
  ]);

  test.deepEqual(c.autosize, as);
  test.equal(c.style.point.shape, 'square');
  test.deepEqual(c.axis.gridDash, [2, 2]);

  test.end();
});