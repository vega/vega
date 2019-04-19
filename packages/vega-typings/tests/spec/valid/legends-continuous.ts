import { Spec } from 'vega';

export const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "padding": 5,

  "config": {
    "legend": {
      "offset": 5,
      "gradientDirection": "horizontal",
      "gradientLength": 300,
      "labelOverlap": {"signal": "labelOverlap"},
      "labelSeparation": {"signal": "labelSeparation"}
    }
  },

  "signals": [
    { "name": "labelOverlap", "value": true,
      "bind": {"input": "checkbox"} },
    { "name": "labelSeparation", "value": 0,
      "bind": {"input": "range", "min": -10, "max": 20, "step": 1} },
    { "name": "seqScheme", "value": "purples" },
    { "name": "linearRange", "value": ["purple", "orange"] }
  ],

  "data": [
    {
      "name": "table",
      "values": [
        {"u": -10}, {"u": 10}
      ]
    },
    {
      "name": "positive",
      "values": [
        {"u": 1}, {"u": 1000}
      ]
    }
  ],

  "scales": [
    {
      "name": "linear",
      "type": "linear",
      "range": "ramp",
      "domain": {"data": "positive", "field": "u"},
      "zero": false, "nice": true
    },
    {
      "name": "pow",
      "type": "pow",
      "exponent": 1.5,
      "range": "ramp",
      "domain": {"data": "positive", "field": "u"},
      "zero": false, "nice": true
    },
    {
      "name": "sqrt",
      "type": "sqrt",
      "range": "ramp",
      "domain": {"data": "positive", "field": "u"},
      "zero": false, "nice": true
    },
    {
      "name": "log10",
      "type": "log",
      "range": "ramp",
      "domain": {"data": "positive", "field": "u"},
      "zero": false, "nice": true
    },
    {
      "name": "log2",
      "type": "log",
      "base": 2,
      "range": "ramp",
      "domain": {"data": "positive", "field": "u"},
      "zero": false, "nice": true
    },
    {
      "name": "symlog",
      "type": "symlog",
      "range": "ramp",
      "domain": {"data": "positive", "field": "u"},
      "zero": false, "nice": true
    },

    {
      "name": "seq0",
      "type": "linear",
      "range": {"scheme": {"signal": "seqScheme"}},
      "domain": {"data": "table", "field": "u"}
    },
    {
      "name": "seq1",
      "type": "linear",
      "range": {"scheme": {"signal": "seqScheme"}, "extent": [0, 1]},
      "domain": {"data": "table", "field": "u"}
    },
    {
      "name": "seq2",
      "type": "linear",
      "range": {"scheme": {"signal": "seqScheme"}, "extent": [0.2, 1]},
      "domain": {"data": "table", "field": "u"}
    },
    {
      "name": "seq3",
      "type": "linear",
      "range": {"scheme": {"signal": "seqScheme"}, "extent": [0.2, 1]},
      "reverse": true,
      "domain": {"data": "table", "field": "u"}
    },
    {
      "name": "seq4",
      "type": "linear",
      "range": {"scheme": {"signal": "seqScheme"}, "extent": [1, 0.2]},
      "domain": {"data": "table", "field": "u"}
    },

    {
      "name": "lin0",
      "type": "linear",
      "range": {"signal": "linearRange"},
      "domain": {"data": "table", "field": "u"}
    },
    {
      "name": "lin1",
      "type": "linear",
      "range": {"signal": "linearRange"},
      "interpolate": "rgb",
      "domain": {"data": "table", "field": "u"}
    },
    {
      "name": "lin2",
      "type": "linear",
      "range": {"signal": "linearRange"},
      "interpolate": {"type": "rgb", "gamma": 2.2},
      "domain": {"data": "table", "field": "u"}
    },
    {
      "name": "lin3",
      "type": "linear",
      "range": {"signal": "linearRange"},
      "interpolate": "lab",
      "domain": {"data": "table", "field": "u"}
    },
    {
      "name": "lin4",
      "type": "linear",
      "range": {"signal": "linearRange"},
      "interpolate": "hcl",
      "domain": {"data": "table", "field": "u"}
    },
    {
      "name": "lin5",
      "type": "linear",
      "range": {"signal": "linearRange"},
      "interpolate": "hsl",
      "domain": {"data": "table", "field": "u"}
    },
    {
      "name": "lin6",
      "type": "linear",
      "range": {"signal": "linearRange"},
      "interpolate": "hcl-long",
      "domain": {"data": "table", "field": "u"}
    },
    {
      "name": "lin7",
      "type": "linear",
      "range": {"signal": "linearRange"},
      "interpolate": "hsl-long",
      "domain": {"data": "table", "field": "u"}
    },

    {
      "name": "div0",
      "type": "linear",
      "range": "diverging",
      "domain": {"data": "table", "field": "u"},
      "domainMid": 0
    },
    {
      "name": "div1",
      "type": "linear",
      "range": "diverging",
      "domain": {"data": "table", "field": "u"},
      "domainMid": -5
    },
    {
      "name": "div2",
      "type": "linear",
      "range": "diverging",
      "domain": {"data": "table", "field": "u"},
      "domainMid": 5
    }
  ],

  "legends": [
    {"orient": "left",  "type": "gradient", "fill": "linear", "title": "Linear Ramp"},
    {"orient": "left",  "type": "gradient", "fill": "pow",    "title": "Pow Ramp - Exponent 1.5"},
    {"orient": "left",  "type": "gradient", "fill": "sqrt",   "title": "Pow Ramp - Exponent 0.5"},
    {"orient": "left",  "type": "gradient", "fill": "log10",  "title": "Log Ramp - Base 10"},
    {"orient": "left",  "type": "gradient", "fill": "log2",   "title": "Log Ramp - Base 2"},
    {"orient": "left",  "type": "gradient", "fill": "symlog", "title": "Symlog Ramp"},

    {"orient": "left",  "type": "gradient", "fill": "seq0", "title": "Scheme"},
    {"orient": "left",  "type": "gradient", "fill": "seq1", "title": "Scheme Extent [0, 1]"},
    {"orient": "left",  "type": "gradient", "fill": "seq2", "title": "Scheme Extent [0.2, 1]"},
    {"orient": "left",  "type": "gradient", "fill": "seq3", "title": "Scheme Extent [0.2, 1] Reverse"},
    {"orient": "left",  "type": "gradient", "fill": "seq4", "title": "Scheme Extent [1, 0.2]"},

    {"orient": "right", "type": "gradient", "fill": "lin0", "title": "Interpolate Default"},
    {"orient": "right", "type": "gradient", "fill": "lin1", "title": "Interpolate RGB"},
    {"orient": "right", "type": "gradient", "fill": "lin2", "title": "Interpolate RGB Gamma 2.2"},
    {"orient": "right", "type": "gradient", "fill": "lin3", "title": "Interpolate LAB"},
    {"orient": "right", "type": "gradient", "fill": "lin4", "title": "Interpolate HCL"},
    {"orient": "right", "type": "gradient", "fill": "lin5", "title": "Interpolate HSL"},
    {"orient": "right", "type": "gradient", "fill": "lin6", "title": "Interpolate HCL-Long"},
    {"orient": "right", "type": "gradient", "fill": "lin7", "title": "Interpolate HSL-Long"},

    {"orient": "right", "type": "gradient", "fill": "div0", "title": "Diverging Mid 0"},
    {"orient": "right", "type": "gradient", "fill": "div1", "title": "Diverging Range Mid -5"},
    {"orient": "right", "type": "gradient", "fill": "div2", "title": "Diverging Range Mid 5"}
  ]
};
