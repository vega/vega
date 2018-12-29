import { Spec } from 'vega';

const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v3.json",
  "width": 600,
  "height": 300,
  "padding": 10,
  "autosize": "fit",

  "config": {
    "axisBand": {
      "bandPosition": 1,
      "labelPadding": -1,
      "tickExtra": true,
      "tickOffset": 0
    }
  },

  "signals": [
    {
      "name": "active",
      "value": null,
      "on": [
        {
          "events": {"marktype": "rect", "type": "mouseover"},
          "update": "datum"
        },
        {
          "events": {"marktype": "rect", "type": "mouseout"},
          "update": "null"
        }
      ]
    }
  ],

  "data": [
    {
      "name": "values",
      "values": [
        {"x": 0,  "y": 28},
        {"x": 1,  "y": 43},
        {"x": 2,  "y": 99},
        {"x": 3,  "y": 56},
        {"x": 4,  "y": 38},
        {"x": 5,  "y": 83},
        {"x": 6,  "y": 69},
        {"x": 7,  "y": 24}
      ]
    }
  ],

  "scales": [
    {
      "name": "xscale",
      "type": "band",
      "range": [0, {"signal": "width"}],
      "round": true,
      "domain": {"data": "values", "field": "x"}
    },
    {
      "name": "yscale",
      "type": "linear",
      "range": [{"signal": "height"}, 0],
      "round": true,
      "domain": {"data": "values", "field": "y"},
      "zero": true,
      "nice": true
    },
    {
      "name": "shapeScale",
      "type": "ordinal",
      "domain": ["a", "b", "c", "d", "e", "f"],
      "range": ["circle", "square", "cross", "diamond", "triangle-up", "triangle-down"]
    },
    {
      "name": "colorScale",
      "type": "ordinal",
      "domain": ["a", "b", "c", "d", "e", "f"],
      "range": "category"
    },
    {
      "name": "innerScale",
      "type": "ordinal",
      "domain": ["alpha", "beta"],
      "range": ["circle", "square"]
    }
  ],

  "axes": [
    {
      "scale": "yscale",
      "orient": "left",
      "tickCount": 5,
      "grid": false,
      "domain": true,
      "title": "Left Title",
      "offset": 10
    },
    {
      "scale": "yscale",
      "orient": "right",
      "tickCount": 5,
      "grid": true,
      "domain": true,
      "title": "Right Title",
      "offset": 10
    },
    {
      "scale": "xscale",
      "orient": "top",
      "grid": false,
      "domain": true,
      "title": "Top Title",
      "offset": 10
    },
    {
      "scale": "xscale",
      "orient": "bottom",
      "grid": true,
      "domain": true,
      "title": "Bottom Title",
      "offset": 10
    }
  ],

  "legends": [
    {
      "shape": "shapeScale",
      "stroke": "colorScale",
      "title": "Legend Right 1"
    },
    {
      "shape": "shapeScale",
      "fill": "colorScale",
      "orient": "right",
      "title": "Legend Right 2"
    },
    {
      "shape": "shapeScale",
      "orient": "left",
      "title": "Legend Left 1"
    },
    {
      "stroke": "colorScale",
      "orient": "left",
      "title": "Legend Left 2"
    },
    {
      "shape": "innerScale",
      "orient": "top-left",
      "offset": 5,
      "padding": 4,
      "encode": {
        "legend": {
          "enter": {
            "fill": {"value": "#fff"},
            "fillOpacity": {"value": 0.5},
            "stroke": {"value": "#888"},
            "cornerRadius": {"value": 4}
          }
        }
      }
    },
    {
      "shape": "innerScale",
      "orient": "top-right",
      "offset": 5,
      "padding": 4,
      "encode": {
        "legend": {
          "enter": {
            "fill": {"value": "#fff"},
            "fillOpacity": {"value": 0.5},
            "stroke": {"value": "#888"},
            "cornerRadius": {"value": 4}
          }
        }
      }
    },
    {
      "shape": "innerScale",
      "orient": "bottom-left",
      "offset": 6,
      "padding": 4,
      "encode": {
        "legend": {
          "enter": {
            "fill": {"value": "#fff"},
            "fillOpacity": {"value": 0.5},
            "stroke": {"value": "#888"},
            "cornerRadius": {"value": 4}
          }
        }
      }
    },
    {
      "shape": "innerScale",
      "orient": "bottom-right",
      "offset": 6,
      "padding": 4,
      "encode": {
        "legend": {
          "interactive": true,
          "enter": {
            "fill": {"value": "#fff"},
            "fillOpacity": {"value": 0.5},
            "stroke": {"value": "#888"},
            "cornerRadius": {"value": 4}
          },
          "update": {
            "stroke": {"value": "#888"}
          },
          "hover": {
            "stroke": {"value": "#f8f"}
          }
        }
      }
    }
  ],

  "marks": [
    {
      "type": "rect",
      "from": {"data": "values"},
      "encode": {
        "update": {
          "x": {"scale": "xscale", "field": "x"},
          "width": {"scale": "xscale", "band": 1, "offset": -1},
          "y": {"scale": "yscale", "field": "y"},
          "y2": {"scale": "yscale", "value": 0},
          "fill": {"value": "steelblue"},
          "fillOpacity": {"value": 0.5},
          "stroke": {"color": {
            "l": {"value": 50},
            "a": {"value": 100},
            "b": {"value": -20}
          }},
          "strokeWidth": [
            {"test": "datum===active", "value": 5},
            {"value": 0}
          ]
        }
      }
    }
  ]
}
