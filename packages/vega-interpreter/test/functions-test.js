import tape from 'tape';
import functions from '../src/functions.js';
import {functions as codegenFunctions} from '../../vega-expression/index.js';

tape('Date', t => {
  t.equal(functions.datetime(2025).getDate(), new Date(2025, 0, 1, 0, 0, 0, 0).getDate());
  t.equal(functions.datetime('2005-08-01T00:00:00').getDate(), new Date(2025, 8, 1, 0, 0, 0, 0).getDate());
  t.end();
});

// The two lists below record the *known intentional* divergences between the
// code generator's function table and the interpreter's. Do not add a name here
// just to make this test pass: a new divergence means one path can evaluate an
// expression the other cannot, which is a bug unless you can justify otherwise.

// Functions the code generator provides but the interpreter deliberately omits.
// 'if' is special-cased in interpret.js so that only one branch is evaluated.
const CODEGEN_ONLY = ['if'];

// Functions the interpreter lists but the code generator does not. These are
// legacy entries: vega-functions' functionContext supplies all of them to both
// paths and always shadows these definitions, so they are never reached.
const INTERPRETER_ONLY = [
  'join', 'indexof', 'lastindexof', 'slice', 'reverse', 'sort', 'replace'
];

tape('Function tables agree with vega-expression', t => {
  // the codegen table is a factory taking a codegen callback; it is only
  // invoked when a generated function runs, so a stub suffices to list names.
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
