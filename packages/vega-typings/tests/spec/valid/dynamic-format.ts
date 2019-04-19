import { Spec } from 'vega';

export const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "width": 400,
  "height": 200,
  "padding": 5,

  "signals": [
    {
      "name": "property", "value": "a",
      "bind": {"input": "select", "options": ["a", "b"]}
    }
  ],

  "data": [
    {
      "name": "table",
      "format": {
        "type": "json",
        "property": {"signal": "property"}
      },
      "values": {
        "a": [
          {"u": 1, "v": 28}, {"u":  2, "v": 55},
          {"u": 3, "v": 43}, {"u":  4, "v": 91},
          {"u": 5, "v": 81}, {"u":  6, "v": 53},
          {"u": 7, "v": 19}, {"u":  8, "v": 87},
          {"u": 9, "v": 52}, {"u": 10, "v": 48}
        ],
        "b": [
          {"u": 1, "v": 24}, {"u":  2, "v": 49},
          {"u": 3, "v": 87}, {"u":  4, "v": 66},
          {"u": 5, "v": 17}, {"u":  6, "v": 27},
          {"u": 7, "v": 68}, {"u":  8, "v": 16},
          {"u": 9, "v": 49}, {"u": 10, "v": 15}
        ]
      }
    }
  ],

  "scales": [
    {
      "name": "xscale",
      "type": "band",
      "range": "width",
      "padding": 0.05,
      "round": true,
      "domain": {"data": "table", "field": "u"}
    },
    {
      "name": "yscale",
      "type": "linear",
      "range": "height",
      "domain": {"data": "table", "field": "v"},
      "zero": true,
      "nice": true
    }
  ],

  "axes": [
    {"orient": "bottom", "scale": "xscale", "zindex": 1},
    {"orient": "left", "scale": "yscale", "zindex": 1}
  ],

  "marks": [
    {
      "type": "rect",
      "from": {"data": "table"},
      "encode": {
        "enter": {
          "x": {"scale": "xscale", "field": "u"},
          "width": {"scale": "xscale", "band": 1},
          "y": {"scale": "yscale", "field": "v"},
          "y2": {"scale": "yscale", "value": 0}
        },
        "update": {
          "fill": {"value": "steelblue"}
        },
        "hover": {
          "fill": {"value": "red"}
        }
      }
    }
  ]
};
