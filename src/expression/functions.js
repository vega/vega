var datalib = require('datalib');

module.exports = function(codegen) {

  function fncall(name, args, cast, type) {
    var obj = codegen(args[0]);
    if (cast) {
      obj = cast + "(" + obj + ")";
      if (dl.startsWith(cast, "new ")) obj = "(" + obj + ")";
    }
    return obj + "." + name + (type < 0 ? "" : type === 0
      ? "()"
      : "(" + args.slice(1).map(codegen).join(",") + ")");
  }
  
  var DATE = "new Date";
  var STRING = "String";
  var REGEXP = "RegExp";

  return {
    // MATH functions
    "isNaN":    "isNaN",
    "isFinite": "isFinite",
    "abs":      "Math.abs",
    "acos":     "Math.acos",
    "asin":     "Math.asin",
    "atan":     "Math.atan",
    "atan2":    "Math.atan2",
    "ceil":     "Math.ceil",
    "cos":      "Math.cos",
    "exp":      "Math.exp",
    "floor":    "Math.floor",
    "log":      "Math.log",
    "max":      "Math.max",
    "min":      "Math.min",
    "pow":      "Math.pow",
    "random":   "Math.random",
    "round":    "Math.round",
    "sin":      "Math.sin",
    "sqrt":     "Math.sqrt",
    "tan":      "Math.tan",

    // DATE functions
    "now":      "Date.now",
    "datetime": "new Date",
    "date": function(args) {
        return fncall("getDate", args, DATE, 0);
      },
    "day": function(args) {
        return fncall("getDay", args, DATE, 0);
      },
    "year": function(args) {
        return fncall("getFullYear", args, DATE, 0);
      },
    "month": function(args) {
        return fncall("getMonth", args, DATE, 0);
      },
    "hours": function(args) {
        return fncall("getHours", args, DATE, 0);
      },
    "minutes": function(args) {
        return fncall("getMinutes", args, DATE, 0);
      },
    "seconds": function(args) {
        return fncall("getSeconds", args, DATE, 0);
      },
    "milliseconds": function(args) {
        return fncall("getMilliseconds", args, DATE, 0);
      },
    "time": function(args) {
        return fncall("getTime", args, DATE, 0);
      },
    "timezoneoffset": function(args) {
        return fncall("getTimezoneOffset", args, DATE, 0);
      },
    "utcdate": function(args) {
        return fncall("getUTCDate", args, DATE, 0);
      },
    "utcday": function(args) {
        return fncall("getUTCDay", args, DATE, 0);
      },
    "utcyear": function(args) {
        return fncall("getUTCFullYear", args, DATE, 0);
      },
    "utcmonth": function(args) {
        return fncall("getUTCMonth", args, DATE, 0);
      },
    "utchours": function(args) {
        return fncall("getUTCHours", args, DATE, 0);
      },
    "utcminutes": function(args) {
        return fncall("getUTCMinutes", args, DATE, 0);
      },
    "utcseconds": function(args) {
        return fncall("getUTCSeconds", args, DATE, 0);
      },
    "utcmilliseconds": function(args) {
        return fncall("getUTCMilliseconds", args, DATE, 0);
      },

    // shared sequence functions
    "length": function(args) {
        return fncall("length", args, null, -1);
      },
    "indexof": function(args) {
        return fncall("indexOf", args, null);
      },
    "lastindexof": function(args) {
        return fncall("lastIndexOf", args, null);
      },

    // STRING functions
    "parseFloat": "parseFloat",
    "parseInt": "parseInt",
    "upper": function(args) {
        return fncall("toUpperCase", args, STRING, 0);
      },
    "lower": function(args) {
        return fncall("toLowerCase", args, STRING, 0);
      },
    "slice": function(args) {
        return fncall("slice", args, STRING);
      },
    "substring": function(args) {
        return fncall("substring", args, STRING);
      },

    // REGEXP functions
    "test": function(args) {
        return fncall("test", args, REGEXP);
      },
    
    // Control Flow functions
    "if": function(args) {
        if (args.length < 3)
          throw new Error("Missing arguments to if function.");
        if (args.length > 3)
        throw new Error("Too many arguments to if function.");
        var a = args.map(codegen);
        return a[0]+"?"+a[1]+":"+a[2];
      }
  };
};