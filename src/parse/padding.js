define(function(require, module, exports) {
  var util = require('../util/index');

  return function parsePadding(pad) {
    if (pad == null) return "auto";
    else if (util.isString(pad)) return pad==="strict" ? "strict" : "auto";
    else if (util.isObject(pad)) return pad;
    var p = util.isNumber(pad) ? pad : 20;
    return {top:p, left:p, right:p, bottom:p};
  }
});