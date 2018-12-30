import { Spec } from 'vega';

// https://vega.github.io/editor/#/examples/vega/bar-chart
export const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v4.json",
  "width": 300,
  "height": 300,
  "padding": 5,
  "autosize": "pad",

  "signals": [
    {
      "name": "count",
      "value": 0,
      "on": [
        {
          "events": {"type": "timer", "throttle": 500},
          "update": "(count + 1) % 10"
        }
      ]
    }
  ],

  "data": [
    {
      "name": "points",
      "url": "data/normal-2d.json"
    },
    {
      "name": "source",
      "source": "points",
      "transform": [
        {"type": "filter", "expr": "(count + 1) && random() < 0.1"}
      ]
    },
    {
      "name": "summary",
      "source": "source",
      "transform": [
        {
          "type": "aggregate",
          "fields": ["v", "v", "u", "u"],
          "ops": ["mean", "stderr", "mean", "stderr"],
          "as": ["vm", "ve", "um", "ue"]
        }
      ]
    }
  ],

  "scales": [
    {
      "name": "x",
      "type": "linear",
      "nice": true,
      "domain": {"data": "points", "fields": ["u", "v"]},
      "range": "width"
    },
    {
      "name": "y",
      "type": "linear",
      "nice": true,
      "domain": {"data": "points", "fields": ["u", "v"]},
      "range": "height"
    }
  ],

  "axes": [
    { "scale": "x", "orient": "bottom" },
    { "scale": "y", "orient": "left" }
  ],

  "marks": [
    {
      "type": "rect",
      "from": {"data": "summary"},
      "encode": {
        "enter": {
          "fill": {"value": "#aaa"},
          "fillOpacity": {"value": 0.2}
        },
        "update": {
          "x": {"value": 0},
          "x2": {"signal": "width"},
          "y": {"signal": "scale('y', datum.vm - 1.96*datum.ve)"},
          "y2": {"signal": "scale('y', datum.vm + 1.96*datum.ve)"}
        }
      }
    },
    {
      "type": "rect",
      "from": {"data": "summary"},
      "encode": {
        "enter": {
          "fill": {"value": "#aaa"},
          "fillOpacity": {"value": 0.2}
        },
        "update": {
          "y": {"value": 0},
          "y2": {"signal": "height"},
          "x": {"signal": "scale('x', datum.um - 1.96*datum.ue)"},
          "x2": {"signal": "scale('x', datum.um + 1.96*datum.ue)"}
        }
      }
    },
    {
      "type": "symbol",
      "from": {"data": "source"},
      "encode": {
        "enter": {
          "size": {"value": 25}
        },
        "update": {
          "x": {"scale": "x", "field": "u"},
          "y": {"scale": "y", "field": "v"}
        }
      }
    },
    {
      "type": "rule",
      "from": {"data": "summary"},
      "encode": {
        "enter": {
          "stroke": {"value": "firebrick"},
          "strokeWidth": {"value": 1.5}
        },
        "update": {
          "x": {"value": 0},
          "x2": {"signal": "width"},
          "y": {"scale": "y", "field": "vm"}
        }
      }
    },
    {
      "type": "rule",
      "from": {"data": "summary"},
      "encode": {
        "enter": {
          "stroke": {"value": "firebrick"},
          "strokeWidth": {"value": 1.5}
        },
        "update": {
          "y": {"value": 0},
          "y2": {"signal": "height"},
          "x": {"scale": "x", "field": "um"}
        }
      }
    }
  ]
};
