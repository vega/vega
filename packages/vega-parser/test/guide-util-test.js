var tape = require('tape'),
  axisAriaLabel = require('../').axisAriaLabel,
  legendAriaLabel = require('../').legendAriaLabel;

tape('Creates correct axis aria labels', function(t) {
  t.deepEqual(
    axisAriaLabel({scale: 'xscale'}, {scales: {xscale: {params: {type: 'linear'}}}}),
    { signal: '"y axis from " + domain("xscale")[0] + " to " + domain("xscale")[1]'}
  );

  t.deepEqual(
    axisAriaLabel({scale: 'xscale', title: 'Foo'}, {scales: {xscale: {params: {type: 'linear'}}}}),
    { signal: '"y axis showing Foo from " + domain("xscale")[0] + " to " + domain("xscale")[1]' }
  );

  t.deepEqual(
    axisAriaLabel({scale: 'xscale', title: {signal: 'foo'}}, {scales: {xscale: {params: {type: 'linear'}}}}),
    { signal: '"y axis showing " + foo + " from " + domain("xscale")[0] + " to " + domain("xscale")[1]' }
  );


  t.end();
});

tape('Creates correct legend aria labels', function(t) {
  t.deepEqual(
    legendAriaLabel({fill: 'color'}, {scales: {color: {params: {type: 'linear'}}}}),
    { signal: '"legend from " + domain("color")[0] + " to " + domain("color")[1] + " as fill"' }
  );

  t.deepEqual(
    legendAriaLabel({fill: 'color', title: 'Foo'}, {scales: {color: {params: {type: 'linear'}}}}),
    { signal: '"legend showing Foo from " + domain("color")[0] + " to " + domain("color")[1] + " as fill"' }
  );

  t.deepEqual(
    legendAriaLabel({fill: 'color', size: 'size', title: 'Foo'}, {scales: {color: {params: {type: 'linear'}}, size: {params: {type: 'linear'}}}}),
    { signal: '"legend showing Foo from " + domain("color")[0] + " to " + domain("color")[1] + " as fill, from " + domain("size")[0] + " to " + domain("size")[1] + " as size"' }
  );

  t.end();
});
