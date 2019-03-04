var vega = require('vega-dataflow'), runtime = require('../'), events = require('./events');

test('Parser parses event-driven operator updates', function() {
  var spec = {
    operators: [
      { id:0, type:'Operator', value:50 },
      { id:1, type:'Operator', value:0 },
      { id:2, type:'Operator', value:0, update:'this.value + 1' }
    ],
    streams: [
      { id:3, source:'window', type:'mousemove' },
      { id:4, source:'window', type:'mousedown' },
      { id:5, source:'window', type:'mouseup' },
      { id:6, stream:3, between:[4,5] }
    ],
    updates: [
      { source:4, target:2 },             // touch to re-run
      { source:6, target:0, update: -1 }, // set literal value
      { source:6, target:1, update: {     // evaluate expression
        $expr: '2 * _.op + event.buttons',
        $params: {op:{$ref:2}}
      } }
    ]
  };

  var df = new vega.Dataflow();
  df.events = events.events;
  df.fire = events.fire;

  var ctx = runtime.parse(spec, runtime.context(df, {})),
      ops = ctx.nodes;

  df.update(ops[0], 2).run();
  expect(ops[0].value).toBe(2);
  expect(ops[1].value).toBe(0);
  expect(ops[2].value).toBe(1);

  df.fire('window', 'mousedown', {});
  expect(ops[0].value).toBe(2);
  expect(ops[1].value).toBe(0);
  expect(ops[2].value).toBe(2);

  df.fire('window', 'mousemove', {buttons: 1});
  expect(ops[0].value).toBe(-1);
  expect(ops[1].value).toBe(5);
  expect(ops[2].value).toBe(2);

  df.fire('window', 'mouseup', {});
  df.fire('window', 'mousemove', {buttons: 1});
  expect(ops[0].value).toBe(-1);
  expect(ops[1].value).toBe(5);
  expect(ops[2].value).toBe(2);
});
