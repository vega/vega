# vega-expression

[Vega](http://github.com/vega/vega) expression parser and code generator.

Parses a [limited subset](https://github.com/vega/vega/wiki/Expressions) of JavaScript expressions into an abstract syntax tree, and provides code generation utilities for generating `eval`'able output code. The parser recognizes basic JavaScript expressions, but does not allow assignment operators, `new` expressions, or control flow statements (`for`, `while`, `switch`, etc). The configurable code generator further limits the set of allowable function invocations and variable names. The goal is to provide simple, expressive and security-conscious expression evaluation.

### API Usage

The top-level export includes three methods:

<b>parse</b>(<i>input</i>)

Parse the _input_ JavaScript expression string and return the resulting abstract syntax tree in the [ESTree (formerly Mozilla AST) format](https://github.com/estree/estree). The parser is based on a stripped-down version of the [Esprima](http://esprima.org/) parser.

<b>codegen</b>(<i>options</i>)

Create a new output code generator configured according to the provided options. The resulting generator function accepts a parsed AST as input and returns `eval`'able JavaScript code as output. The output is an object hash with the properties `code` (the generated code as a string), `fields` (a hash of all properties referenced within the _fieldvar_ scope), and `globals` (a hash of all properties referenced outside a provided whitelist).

The supported _options_ include:

* _constants_: A hash of allowed top-level constant values. This object maps from constant names to constant values. The constant values are strings that will be injected as-is into generated code.

* _functions_: A function that is given a code generator instance as input and returns a hash of allowed top-level functions. The resulting hash maps from function names to function values. The values may either be strings (which will be injected as-is into generated code and subsequently appended with arguments) or functions (which take an array of argument AST nodes as input and return generated code to inject).

* _blacklist_: An array of variable names that may __not__ be referenced within the expression scope. These may correspond to disallowed global variables.

* _whitelist_: An array of variable names that may be referenced within the expression scope. These typically correspond to function parameter names for the expression. Variable names not included in the white list will be collected as global variables (see _globalvar_ below).

* _fieldvar_: The name of the primary data input argument within the generated expression function. For example, in the function `function(d) { return d.x * d.y; }`, the variable `d` serves as the field variable, and `x` and `y` are it's accessed properties. All properties accessed under the scope of _fieldvar_ will be tracked by the code generator and returned as part of the output. This is necessary to perform dependency tracking of referenced data fields.

* _globalvar_: The name of the variable upon which to lookup global variables. This variable name will be included in the generated code as the scope for any global variable references. Alternatively, this property can be a function that maps from variable names in the source input to generated code to write to the output.
