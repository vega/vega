var dl = require('datalib');

module.exports = function parsePadding(pad) {
  if (pad == null) return "auto";
  else if (dl.isString(pad)) return pad==="strict" ? "strict" : "auto";
  else if (dl.isObject(pad)) return pad;
  var p = dl.isNumber(pad) ? pad : 20;
  return {top:p, left:p, right:p, bottom:p};
}