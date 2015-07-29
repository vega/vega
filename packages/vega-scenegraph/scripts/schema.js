var dl = require('datalib');

function build(strict) {
  var schema = dl.duplicate(BASE);
  for (var type in MARKS) {
    buildMark(type, schema.refs, strict);
  }
  for (var type in GUIDES) {
    buildGuide(type, schema.refs, strict);
  }
  return schema;
}

function buildMark(type, refs, strict) {
  var mark = dl.duplicate(MARK_BASE);
  mark.properties.marktype.enum = [ type ];
  mark.properties.items.items.$ref += type;
  if (strict) mark.additionalProperties = false;
  
  var item = dl.duplicate(ITEM_BASE);
  dl.extend(item.properties, MARKS[type].properties || {});
  if (strict) item.additionalProperties = false;

  refs.mark.oneOf.push({$ref: '#/refs/mark-' + type});  
  refs['mark-'+type] = mark;
  refs['item-'+type] = item;
}

function buildGuide(type, refs, strict) {
  var mark = dl.duplicate(MARK_BASE);
  mark.properties.marktype.enum = [ 'group' ];
  mark.properties.items.items.$ref += type;
  dl.extend(mark.properties, GUIDES[type].mark || {});
  if (strict) mark.additionalProperties = false;
  
  var item = dl.duplicate(ITEM_BASE);
  dl.extend(item.properties, GUIDES[type].properties || {});
  if (strict) item.additionalProperties = false;

  refs['mark-'+type] = mark;
  refs['item-'+type] = item;
}

function svg_path() {
  // Based on http://www.w3.org/TR/SVG/paths.html#PathDataBNF
  var wsp  = '[ \t\r\f]*',
      csp  = '([ \t\r\f]+,?[ \t\r\f]*|,[ \t\r\f]*)?',
      sep  = csp + '?',
      pos  = '[0-9]*\\.?[0-9]+([eE][-+]?[0-9]+)?',
      num  = '[-+]?' + pos,
      nseq = num + '(' + sep + num + ')*',
      p    = num + sep + num,
      p2   = p + sep + p,
      p3   = p + '(' + sep + p + '){2}',
      pseq = p + '(' + sep + p + ')*',
      arc  = pos + sep + pos + sep + num + csp + '[01]' + sep + '[01]' + sep + p,
      m  = '[Mm]'   + wsp + pseq,
      lt = '[LlTt]' + wsp + pseq,
      hv = '[HhVv]' + wsp + nseq,
      c  = '[Cc]'   + wsp + p3 + '(' + sep + p3 + ')*',
      qs = '[QqSs]' + wsp + p2 + '(' + sep + p2 + ')*',
      a  = '[Aa]'   + wsp + arc + '(' + sep + arc + ')*',
      z  = '[Zz]',
      draw = '(' + [z, lt, hv, c, qs, a].join('|') + ')',
      move = m + wsp + '(' + draw + '(' + sep + draw + ')*' + ')?',
      path = wsp + '(' + move + '(' + sep + move + ')*' + ')?' + wsp;
  return path;
}

function css_color_names() {
  return COLOR_NAMES.split('|').map(function(name) {
    return name.split('').map(function(c) {
      return '[' + c.toUpperCase() + c.toLowerCase() + ']';
    }).join('');
  }).join('|');
}

var COLOR_NAMES = 'aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen';

var BASE = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Vega scenegraph",
  "description": "Vega scenegraph model.",
	"oneOf": [ { "$ref": "#/refs/mark" } ],
  "refs": {
    "mark": { "oneOf": [] },
    "path": {
      "type": "string",
      "pattern": "^" + svg_path() + "$"
    },
    "paint": {
      "oneOf": [
        { "$ref": "#/refs/color" },
        { "$ref": "#/refs/linear-gradient" }
      ]
    },
    "color": {
      "oneOf": [
        {
          "type": "string",
          "pattern": "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"
        },
        {
          "type": "string",
          "pattern": "^rgb\\([ \t\f]*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(,[ \t\f]*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){2}[ \t\f]*\\)$"
        },
        {
          "type": "string",
          "pattern": "^rgb\\([ \t\f]*([0-9]|[1-9][0-9]|100)%(,[ \t\f]*([0-9]|[1-9][0-9]|100)%){2}[ \t\f]*\\)$"
        },
        {
          "type": "string",
          "pattern": "^hsl\\([ \t\f]*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-9][0-9]|3[0-5][0-9]|360)(,[ \t\f]*([0-9]|[1-9][0-9]|100)%){2}[ \t\f]*\\)$"
        },
        {
          "type": "string",
          "pattern": "^(" + css_color_names() + ")$"
        }
      ]
    },
    "linear-gradient": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "type": { "enum": [ "linear" ] },
        "x1": { "type": "number" },
        "y1": { "type": "number" },
        "x2": { "type": "number" },
        "y2": { "type": "number" },
        "stops": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "offset": { "type": "number" },
              "color": { "$ref": "#/refs/color" }
            }
          }
        }
      },
      "required": ["id", "type", "x1", "y1", "x2", "y2", "stops"],
      "additionalProperties": false
    }
  }
};

var MARK_BASE = {
  "type": "object",
  "properties": {
    "marktype": { "enum": null },
    "name": { "type": "string" },
    "interactive": { "type": "boolean", "default": true },
    "items": {
      "type": "array",
      "items": { "$ref": "#/refs/item-" }
    }
  },
  "required": [ "marktype" ]
};

var ITEM_BASE = {
  "type": "object",
  "properties": {
    "x": { "type": "number" },
    "y": { "type": "number" },
    "width": { "type": "number" },
    "height": { "type": "number" },
    "opacity": { "type": "number", "default": 1 },
    "fill": { "$ref": "#/refs/paint" },
    "fillOpacity": { "type": "number", "default": 1 },
    "stroke": { "$ref": "#/refs/paint" },
    "strokeOpacity": { "type": "number", "default": 1 },
    "strokeWidth": { "type": "number", "default": 1 },
    "strokeCap": { "enum": [ "butt", "cap", "round" ], "default": "butt" },
    "strokeDash": { "type": "array", "items": { "type": "number" } },
    "strokeDashOffset": { "type": "number", "default": 0 }
  }
};

var GUIDES = {
  "axis": {
    "mark": {
      "layer": { "enum": [ "front", "back" ] },
    },
    "properties": {
      "clip": { "type": "boolean" },
      "items": { "type": "array", "items": { "$ref": "#/refs/mark" } }
    }
  },
  "legend": {
    "properties": {
      "clip": { "type": "boolean" },
      "items": { "type": "array", "items": { "$ref": "#/refs/mark" } }
    }
  }
}

var MARKS = {
  "group": {
    "properties": {
      "clip": { "type": "boolean" },
      "items": { "type": "array", "items": { "$ref": "#/refs/mark" } },
      "axisItems": { "type": "array", "items": { "$ref": "#/refs/mark-axis" } },
      "legendItems": { "type": "array", "items": { "$ref": "#/refs/mark-legend" } }
    }
  },
  "arc": {
    "properties": {
      "startAngle": { "type": "number" },
      "endAngle": { "type": "number" },
      "innerRadius": { "type": "number" },
      "outerRadius": { "type": "number" }
    }
  },
  "area": {
    "properties": {
      "interpolate": { "type": "string" },
      "tension": { "type": "number" },
      "orient": { "enum": [ "horizontal", "vertical" ] }
    }
  },
  "image": {
    "properties": {
      "url": { "type": "string", "format": "uri" },
      "align": {
        "enum": [ "left", "center", "right" ],
        "default": "left"
      },
      "baseline": {
        "enum": [ "top", "middle", "bottom" ],
        "default": "top"
      }
    }
  },
  "line": {
    "properties": {
      "interpolate": { "type": "string" },
      "tension": { "type": "number" },
      "orient": { "enum": [ "horizontal", "vertical" ] }
    }
  },
  "path": {
    "properties": {
      "path": { "$ref": "#/refs/path" }
    }
  },
  "rect": {
    "properties": {}
  },
  "rule": {
    "properties": {
      "x2": { "type": "number" },
      "y2": { "type": "number" }
    }
  },
  "symbol": {
    "properties": {
      "size": { "type": "number", "default": 100 },
      "shape": { "type": "string" }
    }
  },
  "text": {
    "properties": {
      "text": { "type": "string" },
      "align": {
        "enum": [ "left", "center", "right" ],
        "default": "left"
      },
      "baseline": {
        "enum": [ "top", "middle", "bottom", "alphabetic" ],
        "default": "alphabetic"
      },
      "angle": { "type": "number", "default": 0 },
      "theta": { "type": "number", "default": 0 },
      "radius": { "type": "number", "default": 0 },
      "dx": { "type": "number", "default": 0 },
      "dy": { "type": "number", "default": 0 },
      "font": { "type": "string", "default": "sans-serif" },
      "fontSize": { "type": "number" },
      "fontStyle": {
        "enum": [ "normal", "italic", "oblique" ],
        "default": "normal"
      },
      "fontWeight": {
        "enum": [
          "normal", "bold", "bolder", "lighter",
          100, 200, 300, 400, 500, 600, 700, 800, 900
        ],
        "default": "normal"
      },
      "fontVariant": {
        "enum": [ "normal", "small-caps" ],
        "default": "normal"
      }
    }
  }
};

var schema = build(true);
process.stdout.write(JSON.stringify(schema, null, 2));
