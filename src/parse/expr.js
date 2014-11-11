define(function(require, exports, module) {
  var util = require('../util/index');
  
  var CONSTANT = {
  	"E":       "Math.E",
  	"LN2":     "Math.LN2",
  	"LN10":    "Math.LN10",
  	"LOG2E":   "Math.LOG2E",
  	"LOG10E":  "Math.LOG10E",
  	"PI":      "Math.PI",
  	"SQRT1_2": "Math.SQRT1_2",
  	"SQRT2":   "Math.SQRT2"
  };

  var FUNCTION = {
  	"abs":    "Math.abs",
  	"acos":   "Math.acos",
  	"asin":   "Math.asin",
  	"atan":   "Math.atan",
  	"atan2":  "Math.atan2",
  	"ceil":   "Math.ceil",
  	"cos":    "Math.cos",
  	"exp":    "Math.exp",
  	"floor":  "Math.floor",
  	"log":    "Math.log",
  	"max":    "Math.max",
  	"min":    "Math.min",
  	"pow":    "Math.pow",
  	"random": "Math.random",
  	"round":  "Math.round",
  	"sin":    "Math.sin",
  	"sqrt":   "Math.sqrt",
  	"tan":    "Math.tan",
    "date":   "Date.parse"
  };
  
  var lexer = /([\"\']|[\=\<\>\~\&\|\?\:\+\-\/\*\%\!\^\,\;\[\]\{\}\(\) ]+)/;
      
  function expr(model, x) {
    var tokens = x.split(lexer),
        t, v, i, n, sq, dq, sg = {}, fd = {},
        args = ["vg", "d", "e", "i"];

    for (sq=0, dq=0, i=0, n=tokens.length; i<n; ++i) {
      var t = tokens[i];
      if (t==="'") { if (!dq) sq = !sq; continue; }
      if (t==='"') { if (!sq) dq = !dq; continue; }
      if (dq || sq) continue;
      if (CONSTANT[t]) {
        tokens[i] = CONSTANT[t];
      }
      if (FUNCTION[t] && (v=tokens[i+1]) && v[0]==="(") {
        tokens[i] = FUNCTION[t];
      }
      if(model.signal((v = util.field(t))[0])) {
        sg[v[0]] = 1;
        tokens[i] = tokens[i].replace(v[0], "sg["+util.str(v[0])+"]");
      }
      if(v[0] == "d") fd[v.splice(1).join("")] = 1;
    }

    return {
      fn: Function("d", "e", "i", "p", "sg", "return ("+tokens.join("")+");"),
      signals: util.keys(sg),
      fields: util.keys(fd)
    };
  };

  expr.eval = function(model, fn, d, e, i, p, sg) {
    sg = model.signal(util.array(sg));
    return fn.call(null, d, e, i, p, sg);
  };

  return expr;
});