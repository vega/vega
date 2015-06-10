var dl = require('datalib');

function parsePadding(pad) {
  if (pad == null) return "auto";
  else if (dl.isString(pad)) return pad==="strict" ? "strict" : "auto";
  else if (dl.isObject(pad)) return pad;
  var p = dl.isNumber(pad) ? pad : 20;
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