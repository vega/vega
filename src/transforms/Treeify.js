var dl = require('datalib'),
    Tuple = require('vega-dataflow').Tuple,
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function Treeify(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    groupby: {type: 'array<field>'}
  });

  this._output = {
    'children': 'children',
    'parent':   'parent'
  };
  return this.router(true).produces(true);
}

var prototype = (Treeify.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Treeify;

prototype.batchTransform = function(input, data) {
  log.debug(input, ['treeifying']);

  var fields = this.param('groupby').field,
      childField = this._output.children,
      parentField = this._output.parent,
      summary = [{name:'*', ops: ['values'], as: [childField]}],
      aggrs = fields.map(function(f) {
        return dl.groupby(f).summarize(summary);
      }),
      prev = this._internal || [], curr = [], i, n;

  function level(index, node, values) {
    var vals = aggrs[index].execute(values);

    node[childField] = vals;
    vals.forEach(function(n) {
      n[parentField] = node;
      curr.push(Tuple.ingest(n));
      if (index+1 < fields.length) level(index+1, n, n[childField]);
      else n[childField].forEach(function(c) { c[parentField] = n; });
    });
  }

  var root = Tuple.ingest({});
  root[parentField] = null;
  curr.push(root);
  level(0, root, data);

  // update changeset with internal nodes
  for (i=0, n=curr.length; i<n; ++i) {
    input.add.push(curr[i]);
  }
  for (i=0, n=prev.length; i<n; ++i) {
    input.rem.push(prev[i]);
  }
  this._internal = curr;

  return input;
};

module.exports = Treeify;

Treeify.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Treeify transform",
  "type": "object",
  "properties": {
    "type": {"enum": ["treeify"]},
    "groupby": {
      "description": "An ordered list of fields by which to group tuples into a tree.",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ]
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "children": {"type": "string", "default": "children"},
        "parent": {"type": "string", "default": "parent"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type", "groupby"]
};
