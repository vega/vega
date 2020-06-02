---
layout: api
title: Parser API
permalink: /docs/api/parser/index.html
---

The Vega **parser** accepts a Vega JSON specification as input and generates a runtime dataflow description as output.

## Parser API Reference

<a name="parse" href="#parse">#</a>
vega.<b>parse</b>(<i>specification</i>[, <i>config</i>, <i>options</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-parser/src/parse.js "Source")

Parses a [Vega JSON _specification_](../../specification) as input and produces a reactive dataflow graph description for a visualization. The output description uses the JSON format of the [vega-runtime](https://github.com/vega/vega/tree/master/packages/vega-runtime) module. To create a visualization, use the runtime dataflow description as the input to a Vega [View](../view) instance.

The optional [_config_ object](../../config) provides visual encoding defaults for marks, scales, axes and legends. Different configuration settings can be used to change choices of layout, color, type faces, font sizes and more to realize different chart themes. If this value is null, the standard configuration is used. If non-null, the provided configuration will be merged with the default settings, with the input taking precedence.

In addition to passing configuration options to this [parse](#parse) method, Vega JSON specifications may also include a top-level `"config"` block specifying configuration properties. Configuration options defined within a Vega JSON file take precedence over those provided to the parse method.

The _options_ object can modfity the parser configuration. The supported options are:

- *ast*: A boolean flag (default `false`) that indicates if abstract syntax trees (ASTs) for Vega [expressions](../../expressions/) should be included in the parser output. By default only generated JavaScript code fragments are included. This option allows third parties to swap out Vega's code generation for an alternative expression evaluator, such as the one provided by the [vega-interpreter package](../../../usage/interpreter). <small>{% include tag ver="5.12" %}</small>
