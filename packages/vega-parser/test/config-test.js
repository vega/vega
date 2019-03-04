var config = require('../').config;

test('Config generates defaults', function() {
  var c = config();

  expect(c.autosize).toBe('pad');
  expect(c.style.point.shape).toBe('circle');
});

test('Config overrides with extended defaults', function() {
  var as = {type: 'pad', resize: 'true'};

  var c = config([
    {autosize: as},
    {style: {point: {shape: 'triangle-right'}}},
    {style: {point: {shape: 'square'}}},
    {axis: {gridDash: [3, 5, 3]}},
    {axis: {gridDash: [2, 2]}},
  ]);

  expect(c.autosize).toEqual(as);
  expect(c.style.point.shape).toBe('square');
  expect(c.axis.gridDash).toEqual([2, 2]);
});
