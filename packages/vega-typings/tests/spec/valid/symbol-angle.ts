import { Spec } from 'vega';

export const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "padding": 5,

  "signals": [
    {
      "name": "baseAngle", "value": 0,
      "bind": {"input": "range", "min": -180, "max": 180, "step": 1}
    }
  ],

  "data": [
    {
      "name": "table",
      "values": [
        {"u":  1, "v":  1, "a":    0, "s": "cross"},
        {"u":  1, "v":  2, "a":   15, "s": "cross"},
        {"u":  1, "v":  3, "a":   30, "s": "cross"},
        {"u":  1, "v":  4, "a":   45, "s": "cross"},
        {"u":  1, "v":  5, "a":   60, "s": "cross"},
        {"u":  1, "v":  6, "a":   75, "s": "cross"},
        {"u":  1, "v":  7, "a":   90, "s": "cross"},
        {"u":  1, "v":  8, "a":  105, "s": "cross"},
        {"u":  1, "v":  9, "a":  120, "s": "cross"},
        {"u":  1, "v": 10, "a":  135, "s": "cross"},
        {"u":  1, "v": 11, "a":  150, "s": "cross"},
        {"u":  1, "v": 12, "a":  165, "s": "cross"},
        {"u":  1, "v": 13, "a":  180, "s": "cross"},
        {"u":  2, "v":  1, "a":    0, "s": "cross"},
        {"u":  2, "v":  2, "a":  -15, "s": "cross"},
        {"u":  2, "v":  3, "a":  -30, "s": "cross"},
        {"u":  2, "v":  4, "a":  -45, "s": "cross"},
        {"u":  2, "v":  5, "a":  -60, "s": "cross"},
        {"u":  2, "v":  6, "a":  -75, "s": "cross"},
        {"u":  2, "v":  7, "a":  -90, "s": "cross"},
        {"u":  2, "v":  8, "a": -105, "s": "cross"},
        {"u":  2, "v":  9, "a": -120, "s": "cross"},
        {"u":  2, "v": 10, "a": -135, "s": "cross"},
        {"u":  2, "v": 11, "a": -150, "s": "cross"},
        {"u":  2, "v": 12, "a": -165, "s": "cross"},
        {"u":  2, "v": 13, "a": -180, "s": "cross"},
        {"u":  3, "v":  1, "a":    0, "s": "triangle"},
        {"u":  3, "v":  2, "a":   15, "s": "triangle"},
        {"u":  3, "v":  3, "a":   30, "s": "triangle"},
        {"u":  3, "v":  4, "a":   45, "s": "triangle"},
        {"u":  3, "v":  5, "a":   60, "s": "triangle"},
        {"u":  3, "v":  6, "a":   75, "s": "triangle"},
        {"u":  3, "v":  7, "a":   90, "s": "triangle"},
        {"u":  3, "v":  8, "a":  105, "s": "triangle"},
        {"u":  3, "v":  9, "a":  120, "s": "triangle"},
        {"u":  3, "v": 10, "a":  135, "s": "triangle"},
        {"u":  3, "v": 11, "a":  150, "s": "triangle"},
        {"u":  3, "v": 12, "a":  165, "s": "triangle"},
        {"u":  3, "v": 13, "a":  180, "s": "triangle"},
        {"u":  4, "v":  1, "a":   0,  "s": "triangle"},
        {"u":  4, "v":  2, "a":  -15, "s": "triangle"},
        {"u":  4, "v":  3, "a":  -30, "s": "triangle"},
        {"u":  4, "v":  4, "a":  -45, "s": "triangle"},
        {"u":  4, "v":  5, "a":  -60, "s": "triangle"},
        {"u":  4, "v":  6, "a":  -75, "s": "triangle"},
        {"u":  4, "v":  7, "a":  -90, "s": "triangle"},
        {"u":  4, "v":  8, "a": -105, "s": "triangle"},
        {"u":  4, "v":  9, "a": -120, "s": "triangle"},
        {"u":  4, "v": 10, "a": -135, "s": "triangle"},
        {"u":  4, "v": 11, "a": -150, "s": "triangle"},
        {"u":  4, "v": 12, "a": -165, "s": "triangle"},
        {"u":  4, "v": 13, "a": -180, "s": "triangle"},
        {"u":  5, "v":  1, "a":    0, "s": "wedge"},
        {"u":  5, "v":  2, "a":   15, "s": "wedge"},
        {"u":  5, "v":  3, "a":   30, "s": "wedge"},
        {"u":  5, "v":  4, "a":   45, "s": "wedge"},
        {"u":  5, "v":  5, "a":   60, "s": "wedge"},
        {"u":  5, "v":  6, "a":   75, "s": "wedge"},
        {"u":  5, "v":  7, "a":   90, "s": "wedge"},
        {"u":  5, "v":  8, "a":  105, "s": "wedge"},
        {"u":  5, "v":  9, "a":  120, "s": "wedge"},
        {"u":  5, "v": 10, "a":  135, "s": "wedge"},
        {"u":  5, "v": 11, "a":  150, "s": "wedge"},
        {"u":  5, "v": 12, "a":  165, "s": "wedge"},
        {"u":  5, "v": 13, "a":  180, "s": "wedge"},
        {"u":  6, "v":  1, "a":   0,  "s": "wedge"},
        {"u":  6, "v":  2, "a":  -15, "s": "wedge"},
        {"u":  6, "v":  3, "a":  -30, "s": "wedge"},
        {"u":  6, "v":  4, "a":  -45, "s": "wedge"},
        {"u":  6, "v":  5, "a":  -60, "s": "wedge"},
        {"u":  6, "v":  6, "a":  -75, "s": "wedge"},
        {"u":  6, "v":  7, "a":  -90, "s": "wedge"},
        {"u":  6, "v":  8, "a": -105, "s": "wedge"},
        {"u":  6, "v":  9, "a": -120, "s": "wedge"},
        {"u":  6, "v": 10, "a": -135, "s": "wedge"},
        {"u":  6, "v": 11, "a": -150, "s": "wedge"},
        {"u":  6, "v": 12, "a": -165, "s": "wedge"},
        {"u":  6, "v": 13, "a": -180, "s": "wedge"},
        {"u":  7, "v":  1, "a":    0, "s": "arrow"},
        {"u":  7, "v":  2, "a":   15, "s": "arrow"},
        {"u":  7, "v":  3, "a":   30, "s": "arrow"},
        {"u":  7, "v":  4, "a":   45, "s": "arrow"},
        {"u":  7, "v":  5, "a":   60, "s": "arrow"},
        {"u":  7, "v":  6, "a":   75, "s": "arrow"},
        {"u":  7, "v":  7, "a":   90, "s": "arrow"},
        {"u":  7, "v":  8, "a":  105, "s": "arrow"},
        {"u":  7, "v":  9, "a":  120, "s": "arrow"},
        {"u":  7, "v": 10, "a":  135, "s": "arrow"},
        {"u":  7, "v": 11, "a":  150, "s": "arrow"},
        {"u":  7, "v": 12, "a":  165, "s": "arrow"},
        {"u":  7, "v": 13, "a":  180, "s": "arrow"},
        {"u":  8, "v":  1, "a":   0,  "s": "arrow"},
        {"u":  8, "v":  2, "a":  -15, "s": "arrow"},
        {"u":  8, "v":  3, "a":  -30, "s": "arrow"},
        {"u":  8, "v":  4, "a":  -45, "s": "arrow"},
        {"u":  8, "v":  5, "a":  -60, "s": "arrow"},
        {"u":  8, "v":  6, "a":  -75, "s": "arrow"},
        {"u":  8, "v":  7, "a":  -90, "s": "arrow"},
        {"u":  8, "v":  8, "a": -105, "s": "arrow"},
        {"u":  8, "v":  9, "a": -120, "s": "arrow"},
        {"u":  8, "v": 10, "a": -135, "s": "arrow"},
        {"u":  8, "v": 11, "a": -150, "s": "arrow"},
        {"u":  8, "v": 12, "a": -165, "s": "arrow"},
        {"u":  8, "v": 13, "a": -180, "s": "arrow"}
      ]
    }
  ],

  "scales": [
    {
      "name": "xscale",
      "type": "band",
      "range": {"step": 50},
      "domain": {"data": "table", "field": "v"}
    },
    {
      "name": "yscale",
      "type": "band",
      "range": {"step": 50},
      "domain": {"data": "table", "field": "u"}
    }
  ],

  "marks": [
    {
      "type": "symbol",
      "from": {"data": "table"},
      "encode": {
        "enter": {
          "shape": {"field": "s"},
          "x": {"scale": "xscale", "field": "v"},
          "y": {"scale": "yscale", "field": "u"},
          "size": {"value": 1000}
        },
        "update": {
          "fill": {"value": "steelblue"},
          "angle": {"field": "a", "offset": {"signal": "baseAngle"}}
        },
        "hover": {
          "fill": {"value": "firebrick"}
        }
      }
    },
    {
      "type": "symbol",
      "from": {"data": "table"},
      "interactive": false,
      "encode": {
        "enter": {
          "shape": {"value": "circle"},
          "x": {"scale": "xscale", "field": "v"},
          "y": {"scale": "yscale", "field": "u"},
          "size": {"value": 9},
          "fill": {"value": "#000"}
        }
      }
    }
  ]
};
