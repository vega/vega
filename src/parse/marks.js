var parseMark = require('./mark');

function parseRootMark(model, spec, width, height) {
  return {
    type: "group",
    width: width,
    height: height,
    scales: spec.scales || [],
    axes: spec.axes || [],
    legends: spec.legends || [],
    marks: (spec.marks || []).map(function(m) { return parseMark(model, m); })
  };
};

module.exports = parseRootMark;
parseRootMark.schemaRefs = {
  "container": {
    "type": "object",
    "properties": {
      // "scales": TODO
      // "axes": TODO
      // "legends": TODO
      "marks": {
        "type": "array",
        "items": {"anyOf":[{"$ref": "#/refs/groupMark"}, {"$ref": "#/refs/mark"}]}
      }
    }
  },

  "groupMark": {
    "allOf": [{"$ref": "#/refs/mark"}, {"$ref": "#/refs/container"}, {
      "properties": {
        "type": {"enum": ["group"]}
      },
      "required": ["type"]
    }]
  }
};
