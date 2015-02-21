var vg_expression_functions = function(codegen) {

  function fncall(name, args, cast, type) {
    var obj = codegen(args[0]);
    if (cast) obj = cast + "(" + obj + ")";
    return obj + "." + name + (type < 0 ? "" : type === 0
      ? "()"
      : "(" + args.slice(1).map(codegen).join(",") + ")");
  }

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
    "date":     "new Date",

    // STRING functions
    "parseFloat": "parseFloat",
    "parseInt": "parseInt",
    "length": function(args) {
        return fncall("length", args, null, -1);
      },
    "upper": function(args) {
        return fncall("toUpperCase", args, "String", 0);
      },
    "lower": function(args) {
        return fncall("toLowerCase", args, "String", 0);
      },
    "slice": function(args) {
        return fncall("slice", args, "String");
      },
    "substring": function(args) {
        return fncall("substring", args, "String");
      },

    // REGEXP functions
    "test": function(args) {
        return fncall("test", args, "RegExp");
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