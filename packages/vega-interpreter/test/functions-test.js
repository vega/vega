import tape from 'tape';
import functions from '../src/functions.js';
import {functions as codegenFunctions} from '../../vega-expression/index.js';

tape('Date', t => {
  t.equal(functions.datetime(2025).getDate(), new Date(2025, 0, 1, 0, 0, 0, 0).getDate());
  t.equal(functions.datetime('2005-08-01T00:00:00').getDate(), new Date(2025, 8, 1, 0, 0, 0, 0).getDate());
  t.end();
});

// Known intentional divergences between the two function tables. Don't add a
// name here just to make this test pass — a divergence means one path can
// evaluate an expression the other can't.

// Special-cased in interpret.js so only one branch is evaluated.
const CODEGEN_ONLY = ['if'];

// Legacy entries, always shadowed by vega-functions' functionContext.
const INTERPRETER_ONLY = [
  'join', 'indexof', 'lastindexof', 'slice', 'reverse', 'sort', 'replace'
];

tape('Function tables agree with vega-expression', t => {
  // the codegen table is a factory; its callback only runs for generated
  // code, so a stub suffices to list names
  const codegen = Object.keys(codegenFunctions(String));
  const interp = Object.keys(functions);

  t.deepEqual(
    codegen.filter(name => !interp.includes(name)).sort(),
    CODEGEN_ONLY.slice().sort(),
    'every codegen function has an interpreter implementation'
  );

  t.deepEqual(
    interp.filter(name => !codegen.includes(name)).sort(),
    INTERPRETER_ONLY.slice().sort(),
    'the interpreter adds no undocumented functions'
  );

  t.end();
});

tape('Math', t => {
  t.equal(functions.hypot(3, 4), 5);
  t.end();
});
