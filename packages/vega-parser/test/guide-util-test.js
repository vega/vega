var tape = require('tape'),
  axisAriaLabel = require('../').axisAriaLabel,
  legendAriaLabel = require('../').legendAriaLabel,
  formatList = require('../').formatList;

const lookupMock = (spec) => (prop) => spec[prop];

tape('Formats list correctly', function(t) {
  t.equals(formatList([]), '');
  t.equals(formatList(['A']), 'A');
  t.equals(formatList(['A', ' B']), 'A and B');
  t.equals(formatList(['A', ' B', ' C']), 'A, B, and C');
  t.equals(formatList(['A', ' B', ' C', ' D']), 'A, B, C, and D');

  t.end();
});

tape('Creates correct axis aria labels', function(t) {
  t.deepEqual(
    axisAriaLabel(lookupMock({scale: 'xscale'}), {scales: {xscale: {params: {type: 'linear'}}}}),
    { signal: '"y axis, represents values from " + domain("xscale")[0] + " to " + domain("xscale")[1]'}
  );

  t.deepEqual(
    axisAriaLabel(lookupMock({scale: 'xscale', title: 'Foo'}), {scales: {xscale: {params: {type: 'linear'}}}}),
    { signal: '"y axis for Foo, represents values from " + domain("xscale")[0] + " to " + domain("xscale")[1]' }
  );

  t.deepEqual(
    axisAriaLabel(lookupMock({scale: 'xscale', title: {signal: 'foo'}}), {scales: {xscale: {params: {type: 'linear'}}}}),
    { signal: '"y axis for " + foo + ", represents values from " + domain("xscale")[0] + " to " + domain("xscale")[1]' }
  );

  t.deepEqual(
    axisAriaLabel(lookupMock({scale: 'xscale', title: 'Foo', format: '.1f'}), {scales: {xscale: {params: {type: 'linear'}}}}),
    { signal: '"y axis for Foo, represents values from " + format(domain("xscale")[0], ".1f") + " to " + format(domain("xscale")[1], ".1f")' }
  );

  t.end();
});

tape('Creates correct legend aria labels', function(t) {
  t.deepEqual(
    legendAriaLabel(lookupMock({fill: 'color'}), {scales: {color: {params: {type: 'linear'}}}}),
    { signal: '"legend, fill color represents values from " + domain("color")[0] + " to " + domain("color")[1] + ""' }
  );

  t.deepEqual(
    legendAriaLabel(lookupMock({fill: 'color', title: 'Foo'}), {scales: {color: {params: {type: 'linear'}}}}),
    { signal: '"legend for Foo, fill color represents values from " + domain("color")[0] + " to " + domain("color")[1] + ""' }
  );

  t.deepEqual(
    legendAriaLabel(lookupMock({fill: 'color', size: 'size', title: 'Foo'}), {scales: {color: {params: {type: 'linear'}}, size: {params: {type: 'linear'}}}}),
    { signal: '"legend for Foo, size represents values from " + domain("size")[0] + " to " + domain("size")[1] + " and fill color represents values from " + domain("color")[0] + " to " + domain("color")[1] + ""' }
  );

  t.deepEqual(
    legendAriaLabel(lookupMock({fill: 'color', title: 'Foo', format: '.1f'}), {scales: {color: {params: {type: 'linear'}}}}),
    { signal: '"legend for Foo, fill color represents values from " + format(domain("color")[0], ".1f") + " to " + format(domain("color")[1], ".1f") + ""' }
  );

  t.end();
});
