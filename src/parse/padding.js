var dl = require('datalib');

function parsePadding(pad) {
  return pad == null ? 'auto' :
    dl.isObject(pad) ? pad :
    dl.isNumber(pad) ? {top:pad, left:pad, right:pad, bottom:pad} :
    pad === 'strict' ? pad : 'auto';
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
