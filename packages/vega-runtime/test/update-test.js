var tape = require('tape'),
    vega = require('vega-dataflow'),
    runtime = require('../'),
    events = require('./events');

tape('Parser parses event-driven operator updates', function(test) {

  var spec = {
    streams: [
      { id:0, source:'window', type:'mousemove' },
      { id:1, source:'window', type:'mousedown' },
      { id:2, source:'window', type:'mouseup' },
      { id:3, stream:0, between:[1,2] }
    ],
    operators: [
      { id:0, type:'Operator', value:50 },
      { id:1, type:'Operator', value:0 },
      { id:2, type:'Expression', value:'(this.value||0) + 1' }
    ],
    updates: [
      { stream:1, operator:2 },             // touch to re-run
      { stream:3, operator:0, update: -1 }, // set literal value
      { stream:3, operator:1, update: {     // evaluate expression
        $expr: '2 * _.op + event.buttons',
        $params: {op:{$ref:2}}
      } }
    ]
  };

  var df = new vega.Dataflow();
  df.events = events.events;

  var ctx = runtime.parse(spec, runtime.context(df, vega)),
      ops = ctx.operators;

  df.update(ops[0], 2).run();
  test.equal(ops[0].value, 2);
  test.equal(ops[1].value, 0);
  test.equal(ops[2].value, 1);

  events.fire('window', 'mousedown', {});
  test.equal(ops[0].value, 2);
  test.equal(ops[1].value, 0);
  test.equal(ops[2].value, 2);

  events.fire('window', 'mousemove', {buttons: 1});
  test.equal(ops[0].value, -1);
  test.equal(ops[1].value, 5);
  test.equal(ops[2].value, 2);

  events.fire('window', 'mouseup', {});
  events.fire('window', 'mousemove', {buttons: 1});
  test.equal(ops[0].value, -1);
  test.equal(ops[1].value, 5);
  test.equal(ops[2].value, 2);

  test.end();
});
