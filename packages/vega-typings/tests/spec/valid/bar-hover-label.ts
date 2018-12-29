import { Spec } from 'vega';

const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v3.json",
  "width": 400,
  "height": 200,
  "padding": 5,

  "signals": [
    {
      "name": "blank",
      "value": {"x": 0, "y": 0}
    },
    {
      "name": "label",
      "update": "blank",
      "on": [
        {"events": "rect:mouseover", "update": "datum"},
        {"events": "rect:mouseout", "update": "blank"}
      ]
    }
  ],

  "data": [
    {
      "name": "table",
      "values": [
        {"x": 1,  "y": 28}, {"x": 2,  "y": 55},
        {"x": 3,  "y": 43}, {"x": 4,  "y": 91},
        {"x": 5,  "y": 81}, {"x": 6,  "y": 53},
        {"x": 7,  "y": 19}, {"x": 8,  "y": 87},
        {"x": 9,  "y": 52}, {"x": 10, "y": 48},
        {"x": 11, "y": 24}, {"x": 12, "y": 49},
        {"x": 13, "y": 87}, {"x": 14, "y": 66},
        {"x": 15, "y": 17}, {"x": 16, "y": 27},
        {"x": 17, "y": 68}, {"x": 18, "y": 16},
        {"x": 19, "y": 49}, {"x": 20, "y": 15}
      ]
    }
  ],

  "scales": [
    {
      "name": "xscale",
      "type": "band",
      "range": "width",
      "padding": 0.05,
      "round": true,
      "domain": {"data": "table", "field": "x"}
    },
    {
      "name": "yscale",
      "type": "linear",
      "range": "height",
      "domain": {"data": "table", "field": "y"},
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
          "x": {"scale": "xscale", "field": "x"},
          "width": {"scale": "xscale", "band": 1},
          "y": {"scale": "yscale", "field": "y"},
          "y2": {"scale": "yscale", "value": 0}
        },
        "update": {
          "fill": [
            {"test": "datum === label", "value": "red"},
            {"value": "steelblue"}
          ]
        }
      }
    },
    {
      "type": "text",
      "encode": {
        "enter": {
          "align": {"value": "center"},
          "fill": {"value": "#333"}
        },
        "update": {
          "x": {"scale": "xscale", "signal": "label.x", "band": 0.5},
          "y": {"scale": "yscale", "signal": "label.y", "offset": -5},
          "text": {"signal": "label.y"},
          "fillOpacity": [
            {"test": "label === blank", "value": 0},
            {"value": 1}
          ]
        }
      }
    }
  ]
}
