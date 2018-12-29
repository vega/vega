import { Spec } from 'vega';

const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v3.json",
  "padding": 5,
  "autosize": "pad",
  "width": 20,
  "height": 200,

  "data": [
    {
      "name": "source",
      "values": [
        {"a": "A", "b": 28},
        {"a": "B", "b": 55},
        {"a": "C", "b": 43},
        {"a": "D", "b": 91},
        {"a": "E", "b": 81},
        {"a": "F", "b": 53},
        {"a": "G", "b": 19},
        {"a": "H", "b": 87},
        {"a": "I", "b": 52}
      ],
      "format": {"type": "json","parse": {"b": "number"}}
    }
  ],

  "scales": [
    {
      "name": "quantize",
      "type": "quantize",
      "range": [1, 80, 160, 240, 320, 400],
      "domain": {"data": "source", "field": "b"},
      "zero": true, "nice": true
    },
    {
      "name": "colorQuantize",
      "type": "quantize",
      "range": {"scheme": "brownbluegreen", "count": 6},
      "domain": {"data": "source", "field": "b"},
      "zero": true, "nice": true
    },
    {
      "name": "quantile",
      "type": "quantile",
      "range": [80, 160, 240, 320, 400],
      "domain": {"data": "source", "field": "b"}
    },
    {
      "name": "colorQuantile",
      "type": "quantile",
      "range": {"scheme": "dark2", "count": 5},
      "domain": {"data": "source", "field": "b"}
    },
    {
      "name": "threshold",
      "type": "threshold",
      "range": [80, 200, 320],
      "domain": [30, 70]
    },
    {
      "name": "colorThreshold",
      "type": "threshold",
      "range": {"scheme": "redyellowblue"},
      "domain": [30, 70]
    },
    {
      "name": "yscale",
      "type": "band",
      "range": [10, {"signal": "height"}],
      "domain": {"data": "source", "field": "a"}
    }
  ],

  "legends": [
    {"size": "quantize", "fill": "colorQuantize", "title": "quantize"},
    {"size": "quantile", "fill": "colorQuantile", "title": "quantile"},
    {"size": "threshold", "fill": "colorThreshold", "title": "threshold"}
  ],

  "marks": [
    {
      "name": "marks",
      "type": "symbol",
      "from": {"data": "source"},
      "encode": {
        "update": {
          "x": {"value": 10},
          "y": {"scale": "yscale", "field": "a"},
          "size": {"scale": "quantize", "field": "b"},
          "fill": {"scale": "colorQuantize", "field": "b"},
          "strokeWidth": {"value": 1.5}
        }
      }
    },
    {
      "type": "text",
      "from": {"data": "source"},
      "encode": {
        "update": {
          "x": {"value": -15},
          "y": {"scale": "yscale", "field": "a"},
          "text": {"field": "b"},
          "baseline": {"value": "middle"}
        }
      }
    }
  ]
}
