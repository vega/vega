export var transforms = [
  {
    "type": "Aggregate",
    "producer": true,
    "params": [
      { "name": "groupby", "type": "field", "array": true, "required": true },
      { "name": "fields", "type": "field", "array": true },
      { "name": "ops", "type": "enum", "array": true,
        "values": [
          "count", "valid", "missing", "distinct",
          "sum", "mean", "average", "variance", "variancep", "stdev",
          "stdevp", "median", "q1", "q3", "modeskew", "min", "max",
          "argmin", "argmax" ] },
      { "name": "as", "type": "string", "array": true },
      { "name": "drop", "type": "boolean", "default": true }
    ],
    "output": ["text", "count"]
  },
  {
    "type": "CountPattern",
    "producer": true,
    "params": [
      { "name": "field", "type": "field", "required": true },
      { "name": "case", "type": "enum", "values": ["upper", "lower", "mixed"], "default": "mixed" },
      { "name": "pattern", "type": "string", "default": "[\\w\"]+" },
      { "name": "stopwords", "type": "string", "default": "" }
    ],
    "output": ["text", "count"]
  },
  {
    "type": "Filter",
    "producer": true,
    "params": [
      { "name": "test", "type": "expr", "required": true }
    ]
  },
  {
    "type": "Fold",
    "producer": true,
    "params": [
      { "name": "fields", "type": "field", "array": true, "required": true }
    ],
    "output": ["key", "value"]
  },
  {
    "name": "formula", "type": "Apply",
    "params": [
      { "name": "apply", "type": "expr", "required": true }
      { "name": "as", "type": "string", "required": true }
    ]
  },
  {
    "type": "Impute",
    "producer": true,
    "params": [
      { "name": "field", "type": "field", "required": true },
      { "name": "groupby", "type": "field", "array": true },
      { "name": "orderby", "type": "field", "array": true },
      { "name": "method", "type": "enum", "default": "value",
        "values": ["value", "mean", "median", "max", "min"] },
      { "name": "value", "default": 0 }
    ]
  },
  {
    "type": "Lookup",
    "params": [
      { "name": "index", "type": "index", "params": [
          {"name": "from", "type": "string", "signal": false, "required": true },
          {"name": "key", "type": "field", "required": true }
        ] },
      { "name": "fields", "type": "field", "array": true, "required": true },
      { "name": "as", "type": "string", "array": true, "required": true },
      { "name": "default", "default": null }
    ]
  },
  {
    "type": "Range",
    "source": true,
    "params": [
      { "name": "start", "type": "number", "required": true },
      { "name": "stop", "type": "number", "required": true },
      { "name": "step", "type": "number", "default": 1 }
    ],
    "output": ["value"]
  },
  {
    "type": "Rank",
    "params": [
      { "name": "field", "type": "field", "required": true },
      { "name": "normalize", "type": "boolean", "default": false }
    ]
  },
  {
    "type": "Sample",
    "source": true,
    "params": [
      { "name": "size", "type": "number", "default": 1000 }
    ]
  },
  {
    "name": "sort", "type": "Collect",
    "source": true,
    "params": [
      { "name": "sort", "type": "compare" }
    ]
  },


  {
    "type": "Force",
    "params": [
      { "name": "static", "type": "boolean", "default": false },
      { "name": "iterations", "type": "number", "default": 300 },
      { "name": "alpha", "type": "number", "default": 1 },
      { "name": "alphaMin", "type": "number", "default": 0.001 },
      { "name": "alphaTarget", "type": "number", "default": 0 },
      { "name": "drag", "type": "number", "default": 0.6 },
      { "name": "fixed", "type": "data" },
      { "name": "forces", "type": "param", "array": true,
        "params": [
          {
            "key": {"force": "center"},
            "params": [
              { "name": "x", "type": "number", "default": 0 },
              { "name": "y", "type": "number", "default": 0 }
            ]
          },
          {
            "key": {"force": "collide"},
            "params": [
              { "name": "radius", "type": "field" },
              { "name": "strength", "type": "number", "default": 0.7 },
              { "name": "iterations", "type": "number", "default": 1 }
            ]
          },
          {
            "key": {"force": "nbody"},
            "params": [
              { "name": "strength", "type": "number", "default": -30 },
              { "name": "theta", "type": "number", "default": 0.9 },
              { "name": "distanceMin", "type": "number", "default": 1 },
              { "name": "distanceMax", "type": "number" }
            ]
          },
          {
            "key": {"force": "link"},
            "params": [
              { "name": "links", "type": "data" },
              { "name": "id", "type": "field" },
              { "name": "distance", "type": "number", "default": 30 },
              { "name": "strength", "type": "number" },
              { "name": "iterations", "type": "number", "default": 1 }
            ]
          },
          {
            "key": {"force": "x"},
            "params": [
              { "name": "strength", "type": "number", "default": 0.1 },
              { "name": "x", "type": "field" }
            ]
          },
          {
            "key": {"force": "y"},
            "params": [
              { "name": "strength", "type": "field", "default": 0.1 },
              { "name": "y", "type": "field" }
            ]
          }
        ] }
    ],
    "output": ["x", "y", "vx", "vy"]
  },
  {
    "type": "LinkPath",
    "params": [
      { "name": "sourceX", "type": "field", "default": "source.x" },
      { "name": "sourceY", "type": "field", "default": "source.y" },
      { "name": "targetX", "type": "field", "default": "target.x" },
      { "name": "targetY", "type": "field", "default": "target.y" },
      { "name": "orient", "type": "enum", "default": "vertical",
        "values": ["horizontal", "vertical", "radial"] },
      { "name": "shape", "type": "enum", "default": "line",
        "values": ["line", "curve", "diagonal", "orthogonal"] }
    ],
    "output": ["path"]
  },
  {
    "type": "Pie",
    "params": [
      { "name": "field", "type": "field" },
      { "name": "startAngle", "type": "number", "default": 0 },
      { "name": "endAngle", "type": "number", "default": 6.283185307179586 },
      { "name": "sort", "type": "boolean", "default": false }
    ],
    "output": ["startAngle", "endAngle"]
  },
  {
    "type": "Stack",
    "params": [
      { "name": "field", "type": "field" },
      { "name": "groupby", "type": "field", "array": true },
      { "name": "sort", "type": "compare" },
      { "name": "offset", "type": "enum", "default": "zero", "values": ["zero", "center", "normalize"] }
    ],
    "output": ["y0", "y1"]
  },
  {
    "type": "Voronoi",
    "params": [
      { "name": "x", "type": "field", "required": true },
      { "name": "y", "type": "field", "required": true },
      { "name": "size", "type": "number", "array": true, "length": 2 }
    ],
    "output": ["path"]
  },


  {
    "type": "Stratify",
    "treesource": true,
    "params": [
      { "name": "key", "type": "field", "required": true },
      { "name": "parentKey", "type": "field", "required": true  }
    ]
  },
  {
    "type": "Nest",
    "treesource": true,
    "params": [
      { "name": "keys", "type": "field", "array": true }
    ]
  },
  {
    "type": "Pack",
    "tree": true,
    "params": [
      { "name": "padding", "type": "number", "default": 0 },
      { "name": "radius", "type": "field", "default": null },
      { "name": "size", "type": "number", "array": true, "length": 2 }
    ],
    "output": ["x", "y", "r"]
  },
  {
    "type": "Partition",
    "tree": true,
    "params": [
      { "name": "padding", "type": "number", "default": 0 },
      { "name": "round", "type": "boolean", "default": false },
      { "name": "size", "type": "number", "array": true, "length": 2 }
    ],
    "output": ["x0", "y0", "x1", "y1"]
  },
  {
    "type": "Tree",
    "tree": true,
    "params": [
      { "name": "method", "type": "enum", "default": "tidy", "values": ["tidy", "cluster"] },
      { "name": "size", "type": "number", "array": true, "length": 2 },
      { "name": "nodeSize", "type": "number", "array": true, "length": 2 }
    ],
    "output": ["x", "y"]
  },
  {
    "type": "Treemap",
    "tree": true,
    "params": [
      { "name": "method", "type": "enum", "default": "squarify",
        "values": ["squarify", "resquarify", "binary", "dice", "slice", "slicedice"] },
      { "name": "padding", "type": "number", "default": 0 },
      { "name": "paddingInner", "type": "number", "default": 0 },
      { "name": "paddingOuter", "type": "number", "default": 0 },
      { "name": "paddingTop", "type": "number", "default": 0 },
      { "name": "paddingRight", "type": "number", "default": 0 },
      { "name": "paddingBottom", "type": "number", "default": 0 },
      { "name": "paddingLeft", "type": "number", "default": 0 },
      { "name": "ratio", "type": "number", "default": 1.618033988749895 },
      { "name": "round", "type": "boolean", "default": false },
      { "name": "size", "type": "number", "array": true, "length": 2 }
    ],
    "output": ["x0", "y0", "x1", "y1"]
  }
];

var lookup = transforms.reduce(function(map, t) {
  var key = t.name || t.type.toLowerCase();
  return map[key] = t, map;
}, {});

export function transformDef(type) {
  return lookup.hasOwnProperty(type) ? lookup[type] : null;
}
