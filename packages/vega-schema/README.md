# vega-schema

Generate the Vega JSON schema.

Run `yarn build` to compile the schema-generating routines and generate the output JSON schema file.

## API Reference

<a name="schema" href="#schema">#</a>
exports.<b>schema</b>(<i>definitions</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-schema/src/schema.js "Source")

Generates the JSON schema, including entries for the provided transform *definitions*. The returned object can be serialized to an ouput JSON file using `JSON.stringify`.
