import tape from 'tape';
import * as vega from 'vega';
import * as interp from '../index.js';
import interpret from '../src/interpret.js';

const names = ['Alpha', 'Alfa', 'Anna', 'Ajax', 'Amber'];
const data = names.map(name => ({name}));

// evaluate an expression once per datum, the way a transform does
function evaluate(expr) {
  const ast = vega.parseExpression(expr);
  return data.map(datum => interpret(ast, {}, {}, datum));
}

tape('Interpreter evaluates a regexp literal independently per datum', t => {
  t.deepEqual(
    evaluate('test(/^A/, datum.name)'),
    [true, true, true, true, true],
    'plain regexp literal'
  );
  t.deepEqual(
    evaluate('test(/^A/g, datum.name)'),
    [true, true, true, true, true],
    'global regexp literal'
  );
  t.deepEqual(
    evaluate('test(/^A/y, datum.name)'),
    [true, true, true, true, true],
    'sticky regexp literal'
  );
  t.deepEqual(
    evaluate('test(/^A/g, datum.name) && test(/a$/g, datum.name)'),
    [true, true, true, false, false],
    'two global regexp literals in one expression'
  );

  t.end();
});

tape('Interpreter matches generated code for regexp literals', t => {
  const expr = 'test(/^A/g, datum.name)';
  const codegen = vega.codegenExpression({
    allowed: ['datum'],
    globalvar: 'global',
    fieldvar: 'datum'
  });
  const {code} = codegen(vega.parseExpression(expr));
  const generated = new Function('datum', 'global', `return (${code});`);

  t.deepEqual(
    evaluate(expr),
    data.map(datum => generated(datum, {})),
    'same result as the generated function'
  );

  t.end();
});

tape('Interpreter filters a dataset with a global regexp literal', async t => {
  const spec = {
    $schema: 'https://vega.github.io/schema/vega/v6.json',
    data: [{
      name: 'table',
      values: data,
      transform: [{type: 'filter', expr: 'test(/^A/g, datum.name)'}]
    }]
  };

  const runtime = vega.parse(spec, null, {ast: true});
  const view = new vega.View(runtime, {
    expr: interp.expressionInterpreter,
    renderer: 'none'
  }).finalize();

  await view.runAsync();

  t.deepEqual(view.data('table').map(d => d.name), names, 'all rows pass the filter');
  t.end();
});
