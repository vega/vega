var util = require('datalib/src/util');

function parsePadding(pad) {
  if (pad == null) return "auto";
  else if (util.isString(pad)) return pad==="strict" ? "strict" : "auto";
  else if (util.isObject(pad)) return pad;
  var p = util.isNumber(pad) ? pad : 20;
  return {top:p, left:p, right:p, bottom:p};
}

module.exports = parsePadding;
parsePadding.schema = {
  "defs": {
    "padding": {
      "oneOf": [{
        "enum": ["strict", "auto"]
      }, {
        "type": "number"
      }, {
        "type": "object",
        "properties": {
          "top": {"type": "number"},
          "bottom": {"type": "number"},
          "left": {"type": "number"},
          "right": {"type": "number"}
        },
        "additionalProperties": false
      }]
    }
  }
};