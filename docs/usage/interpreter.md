---
layout: page
title: Expression Interpreter
menu: usage
permalink: /usage/interpreter/index.html
---

By default, the Vega parser performs code generation for parsed Vega expressions, and the Vega runtime uses the [Function constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function) to create JavaScript functions from the generated code. Although the Vega parser includes its own security checks, the runtime generation of functions from source code nevertheless violates security policies designed to prevent cross-site scripting.

Vega version 5.13.0 and higher adds interpreter support for Vega expressions that is compliant with [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP). The [vega-interpreter](https://github.com/vega/vega/blob/master/packages/vega-interpreter/) package provides a plug-in interpreter that evaluates expressions by traversing an [Abstract Syntax Tree (AST)](https://en.wikipedia.org/wiki/Abstract_syntax_tree) for an expression and performing each operation in turn. Use of the interpreter enables compliance with CSP, but can incur a performance penalty. In tests of initial parse and dataflow evaluation times, the interpreter is on average ~10% slower. Interactive updates may incur higher penalties, as they are often more expression-heavy and amortize the one-time cost of Function constructor parsing.

To use the interpreter, follow these three steps:

1. Load the vega-interpreter module, either using a separate HTML script tag (as shown below) or as part of a custom Vega build.
2. Invoke the Vega parser with the `{ast: true}` option to enable inclusion of parsed ASTs in the output.
3. Pass the interpreter as an option to the Vega View constructor. The runtime will use the alternate expression evaluator.

### Example

In the example below, we are setting the CSP via the HTML Meta tag but in most cases the server mandates a CSP. 

The HTML source of the site.

```html
<head>
  <meta http-equiv="Content-Security-Policy" content="script-src self cdn.jsdelivr.net" />
  <script src="https://cdn.jsdelivr.net/npm/vega@{{ site.data.versions.vega }}"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-interpreter@{{ site.data.versions.interpreter }}"></script>
</head>
<body>
  <div id="view"></div>
  <script src="main.js"></script>
</body>
```

The `main.js` source. We are separating out the script as many CSPs do not allow `unsafe-inline`.

```js
let view;

fetch('https://vega.github.io/vega/examples/bar-chart.vg.json')
  .then(res => res.json())
  .then(spec => render(spec))
  .catch(err => console.error(err));

function render(spec) {
  // Parse the Vega specification with AST output enabled
  // Pass a null configuration value as the second argument
  const runtime = vega.parse(spec, null, { ast: true });

  // Call Vega View constructor with an 'expr' interpreter option
  view = new vega.View(runtime, {
    expr:      vega.expressionInterpreter,
    renderer:  'svg',    // renderer (canvas or svg)
    container: '#view',  // parent DOM container
    hover:     true      // enable hover processing
  });

  return view.runAsync();
}
```
