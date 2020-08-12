# vega-interpreter

An interpreter for Vega expressions, that is [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) compliant. By default, the Vega parser performs code generation for parsed Vega expressions, and the Vega runtime then uses the [Function constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function) to create JavaScript functions from the generated code. Although the Vega parser includes its own security checks, the runtime generation of functions from source code nevertheless violates security policies designed to prevent cross-site scripting.

In addition to generated code, the Vega parser output can include the parsed [Abstract Syntax Tree (AST)](https://en.wikipedia.org/wiki/Abstract_syntax_tree) of an expression. This package provides an interpreter that evaluates expressions by traversing an AST and performing each operation in turn. Use of the interpreter enables compliance with CSP, but can incur a performance penalty. In tests of initial parse and dataflow evaluation times, the interpreter is on average ~10% slower. Interactive update performance may incur higher penalties, as it is often more expression-heavy and also amortizes the one-time cost of Function constructor parsing.

## Usage

To use the interpreter, three steps must be taken:

1. Load the Vega interpreter module, either using a separate HTML script tag or as part of a custom Vega build.
2. Invoke the Vega parser with the `{ ast: true }` option to enable inclusion of parsed ASTs in the output.
3. Pass the interpreter as an option to the Vega View constructor. The underlying runtime will be configured to use the alternate expression evaluator.

```js
const spec; // Vega specification to show.

// Parse the Vega specification with AST output enabled
// Pass a null configuration value as the second argument
const runtimeSpec = vega.parse(spec, null, { ast: true });

// Call the Vega View constructor with an 'expr' interpreter option
const view = new vega.View(runtimeSpec, {
  expr:      vega.expressionInterpreter, // use interpreter
  renderer:  'canvas',  // renderer (canvas or svg)
  container: '#view',   // parent DOM container
  hover:     true       // enable hover processing
});

view.runAsync();
```
