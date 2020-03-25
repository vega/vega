var tape = require('tape'),
  axisAriaLabel = require('../').axisAriaLabel,
  legendAriaLabel = require('../').legendAriaLabel;

const lookupMock = (spec) => (prop) => spec[prop];

tape('Creates correct axis aria labels', function(t) {
  t.deepEqual(
    axisAriaLabel(lookupMock({scale: 'xscale'}), {scales: {xscale: {params: {type: 'linear'}}}}),
    { signal: '"y axis from " + domain("xscale")[0] + " to " + domain("xscale")[1]'}
  );

  t.deepEqual(
    axisAriaLabel(lookupMock({scale: 'xscale', title: 'Foo'}), {scales: {xscale: {params: {type: 'linear'}}}}),
    { signal: '"y axis showing Foo from " + domain("xscale")[0] + " to " + domain("xscale")[1]' }
  );

  t.deepEqual(
    axisAriaLabel(lookupMock({scale: 'xscale', title: {signal: 'foo'}}), {scales: {xscale: {params: {type: 'linear'}}}}),
    { signal: '"y axis showing " + foo + " from " + domain("xscale")[0] + " to " + domain("xscale")[1]' }
  );

  t.deepEqual(
    axisAriaLabel(lookupMock({scale: 'xscale', title: 'Foo', format: '.1f'}), {scales: {xscale: {params: {type: 'linear'}}}}),
    { signal: '"y axis showing Foo from " + format(domain("xscale")[0], ".1f") + " to " + format(domain("xscale")[1], ".1f")' }
  );

  t.end();
});

tape('Creates correct legend aria labels', function(t) {
  t.deepEqual(
    legendAriaLabel(lookupMock({fill: 'color'}), {scales: {color: {params: {type: 'linear'}}}}),
    { signal: '"legend from " + domain("color")[0] + " to " + domain("color")[1] + " as fill"' }
  );

  t.deepEqual(
    legendAriaLabel(lookupMock({fill: 'color', title: 'Foo'}), {scales: {color: {params: {type: 'linear'}}}}),
    { signal: '"legend showing Foo from " + domain("color")[0] + " to " + domain("color")[1] + " as fill"' }
  );

  t.deepEqual(
    legendAriaLabel(lookupMock({fill: 'color', size: 'size', title: 'Foo'}), {scales: {color: {params: {type: 'linear'}}, size: {params: {type: 'linear'}}}}),
    { signal: '"legend showing Foo from " + domain("color")[0] + " to " + domain("color")[1] + " as fill, from " + domain("size")[0] + " to " + domain("size")[1] + " as size"' }
  );

  t.deepEqual(
    legendAriaLabel(lookupMock({fill: 'color', title: 'Foo', format: '.1f'}), {scales: {color: {params: {type: 'linear'}}}}),
    { signal: '"legend showing Foo from " + format(domain("color")[0], ".1f") + " to " + format(domain("color")[1], ".1f") + " as fill"' }
  );

  t.end();
});
