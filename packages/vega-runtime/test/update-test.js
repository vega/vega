var tape = require('tape'),
    vega = require('vega-dataflow'),
    runtime = require('../'),
    events = require('./events');

tape('Parser parses event-driven operator updates', t => {

  const spec = {
    operators: [
      { id:0, type:'Operator', value:50 },
      { id:1, type:'Operator', value:0 },
      { id:2, type:'Operator', value:0, update: {code:'this.value + 1'} }
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
        $expr: {code: '2 * _.op + event.buttons'},
        $params: {op:{$ref:2}}
      } }
    ]
  };

  const df = new vega.Dataflow();
  df.events = events.events;
  df.fire = events.fire;

  var ctx = runtime.context(df, {}).parse(spec),
      ops = ctx.nodes;

  df.update(ops[0], 2).run();
  t.equal(ops[0].value, 2);
  t.equal(ops[1].value, 0);
  t.equal(ops[2].value, 1);

  df.fire('window', 'mousedown', {});
  t.equal(ops[0].value, 2);
  t.equal(ops[1].value, 0);
  t.equal(ops[2].value, 2);

  df.fire('window', 'mousemove', {buttons: 1});
  t.equal(ops[0].value, -1);
  t.equal(ops[1].value, 5);
  t.equal(ops[2].value, 2);

  df.fire('window', 'mouseup', {});
  df.fire('window', 'mousemove', {buttons: 1});
  t.equal(ops[0].value, -1);
  t.equal(ops[1].value, 5);
  t.equal(ops[2].value, 2);

  t.end();
});
