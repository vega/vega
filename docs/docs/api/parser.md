---
layout: api
title: Parser API
permalink: /docs/api/parser/index.html
---

The Vega **parser** accepts a Vega JSON specification as input and generates a runtime dataflow description as output.

## Parser API Reference

<a name="parse" href="#parse">#</a>
vega.<b>parse</b>(<i>specification</i>[, <i>config</i>])
[<>](https://github.com/vega/vega-loader/blob/master/src/parse.js "Source")

Parses a [Vega JSON _specification_](../../specification) as input and produces a reactive dataflow graph description for a visualization. The output description uses the JSON format of the [vega-runtime](https://github.com/vega/vega-runtime) module. To create a visualization, use the runtime dataflow description as the input to a Vega [View](../view) instance.

The optional [_config_ object](../../config) provides visual encoding defaults for marks, scales, axes and legends. Different configuration settings can be used to change choices of layout, color, type faces, font sizes and more to realize different chart themes.

In addition to passing configuration options to this [parse](#parse) method, Vega JSON specifications may also include a top-level `"config"` block specifying configuration properties. Configuration options defined within a Vega JSON file take precedence over those provided to the parse method.
