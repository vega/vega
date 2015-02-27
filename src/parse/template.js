vg.parse.template = function(text) {
  var source = vg.parse.template.source(text, "d");
  source = "var __t; return " + source + ";";

  try {
    return (new Function("d", source)).bind(vg);
  } catch (e) {
    e.source = source;
    throw e;
  }
};

vg.parse.template.source = function(text, variable) {
  variable = variable || "obj";
  var index = 0;
  var source = "'";
  var regex = vg_template_re;

  // Compile the template source, escaping string literals appropriately.
  text.replace(regex, function(match, interpolate, offset) {
    source += text
      .slice(index, offset)
      .replace(vg_template_escaper, vg_template_escapeChar);
    index = offset + match.length;

    if (interpolate) {
      source += "'\n+((__t=("
        + vg_template_var(interpolate, variable)
        + "))==null?'':__t)+\n'";
    }

    // Adobe VMs need the match returned to produce the correct offsets.
    return match;
  });
  return source + "'";
};

var vg_template_var = function(text, variable) {
  var filters = text.split('|');
  var prop = filters.shift().trim();
  var format = [];
  
  var source = vg.field(prop).map(vg.str).join("][");
  source = "(" + variable + "[" + source + "])";
  
  for (var i=0; i<filters.length; ++i) {
    var f = filters[i], args = null, pidx, a, b;

    if ((pidx=f.indexOf(':')) > 0) {
      f = f.slice(0, pidx);
      args = filters[i].slice(pidx+1).split(',')
        .map(function(s) { return s.trim(); });
    }
    f = f.trim();

    switch (f) {
      case 'length':
        source += '.length';
        break;
      case 'lower':
        source += '.toLowerCase()';
        break;
      case 'upper':
        source += '.toUpperCase()';
        break;
      case 'lower-locale':
        source += '.toLocaleLowerCase()';
        break;
      case 'upper-locale':
        source += '.toLocaleUpperCase()';
        break;
      case 'to-string':
        source += '.toString()'
        break;
      case 'trim':
        source += '.trim()';
        break;
      case 'left':
        a = vg.number(args[0]);
        source += '.slice(0,'+a+')';
        break;
      case 'right':
        a = vg.number(args[0]);
        source += '.slice(-'+a+')';
        break;
      case 'mid':
        a = vg.number(args[0]);
        b = a + vg.number(args[1]);
        source += '.slice(+'+a+','+b+')';
        break;
      case 'slice':
        a = vg.number(args[0]);
        source += '.slice('+ a +
          (args.length > 1 ? ',' + vg.number(args[1]) : '') + ')';
        break;
      case 'truncate':
        a = vg.number(args[0]);
        b = args[1];
        b = (b!=="left" && b!=="middle" && b!=="center") ? "right" : b;
        source = 'this.truncate(' + source + ',' + a + ',"' + b + '")';
        break;
      case 'number':
        a = vg_template_format(args[0], d3.format);
        source = 'this.__formats['+a+']('+source+')';
        break;
      case 'time':
        a = vg_template_format(args[0], d3.time.format);
        source = 'this.__formats['+a+']('+source+')';
        break;
      default:
        throw Error("Unrecognized template filter: " + f);
    }
  }
  
  return source;
}

var vg_template_re = /\{\{(.+?)\}\}|$/g;

// Certain characters need to be escaped so that they can be put into a
// string literal.
var vg_template_escapes = {
  "'":      "'",
  '\\':     '\\',
  '\r':     'r',
  '\n':     'n',
  '\u2028': 'u2028',
  '\u2029': 'u2029'
};

var vg_template_escaper = /\\|'|\r|\n|\u2028|\u2029/g;

var vg_template_escapeChar = function(match) {
  return '\\' + vg_template_escapes[match];
};

var vg_template_formats = [];
var vg_template_format_map = {};

var vg_template_format = function(pattern, fmt) {
  if ((pattern[0] === "'" && pattern[pattern.length-1] === "'") ||
      (pattern[0] !== '"' && pattern[pattern.length-1] === '"')) {
    pattern = pattern.slice(1, -1);
  } else {
    throw Error("Format pattern must be quoted: " + pattern);
  }
  if (!vg_template_format_map[pattern]) {
    var f = fmt(pattern);
    var i = vg_template_formats.length;
    vg_template_formats.push(f);
    vg_template_format_map[pattern] = i;
  }
  return vg_template_format_map[pattern];
};

vg.__formats = vg_template_formats;