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
}

module.exports = parseRootMark;

parseRootMark.schema = {
  "defs": {
    "container": {
      "type": "object",
      "properties": {
        "scales": {
          "type": "array",
          "items": {"$ref": "#/defs/scale"}
        },
        "axes": {
          "type": "array",
          "items": {"$ref": "#/defs/axis"}
        },
        "legends": {
          "type": "array",
          "items": {"$ref": "#/defs/legend"}
        },
        "marks": {
          "type": "array",
          "items": {"oneOf":[{"$ref": "#/defs/groupMark"}, {"$ref": "#/defs/visualMark"}]}
        }
      }
    },


    "groupMark": {
      "allOf": [
        {
          "properties": { "type": {"enum": ["group"]} },
          "required": ["type"]
        },
        {"$ref": "#/defs/mark"},
        {"$ref": "#/defs/container"}
      ]
    },

    "visualMark": {
      "allOf": [
        {
          "not": { "properties": { "type": {"enum": ["group"]} } },
        },
        {"$ref": "#/defs/mark"}
      ]   
    }
  }
};
