const tape = require('tape'),
  {createCanvas} = require('canvas'),
  labelWidth = require('../').labelWidth;

function getContext() {
  return createCanvas(1, 1).getContext('2d');
}

tape('labelWidth() works correctly', test => {
  const context = getContext();
  test.equals(labelWidth(context, '', 20, 'Arial'), 0);
  test.equals(labelWidth(context, 'test', 20, 'Arial'), 32.236328125);
  test.end();
});
