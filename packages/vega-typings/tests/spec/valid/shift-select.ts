import { Spec } from 'vega';

const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v3.json",
  "width": 600,
  "height": 300,
  "padding": 10,

  "signals": [
    {
      "name": "shift",
      "value": false,
      "on": [
        {
          "events": {"marktype": "rect", "type": "click"},
          "update": "event.shiftKey",
          "force":  true
        }
      ]
    },
    {
      "name": "clicked",
      "value": null,
      "on": [
        {
          "events": {"marktype": "rect", "type": "click"},
          "update": "datum",
          "force":  true
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
    },
    {
      "name": "selected",
      "on": [
        {"trigger": "!shift", "remove": true},
        {"trigger": "!shift && clicked", "insert": "clicked"},
        {"trigger": "shift && clicked", "toggle": "clicked"}
      ]
    }
  ],

  "scales": [
    {
      "name": "xscale",
      "type": "band",
      "range": "width",
      "round": true,
      "domain": {"data": "values", "field": "x"}
    },
    {
      "name": "yscale",
      "type": "linear",
      "range": "height",
      "round": true,
      "domain": {"data": "values", "field": "y"},
      "zero": true,
      "nice": true
    }
  ],

  "axes": [
    {
      "scale": "yscale",
      "orient": "left",
      "tickCount": 5,
      "zindex": 1
    },
    {
      "scale": "xscale",
      "orient": "bottom",
      "zindex": 1
    }
  ],

  "marks": [
    {
      "type": "rect",
      "from": {"data": "values"},
      "encode": {
        "enter": {
          "x": {"scale": "xscale", "field": "x"},
          "width": {"scale": "xscale", "band": 1},
          "y": {"scale": "yscale", "field": "y"},
          "y2": {"scale": "yscale", "value": 0}
        },
        "update": {
          "fill": [
            {"test": "indata('selected', 'x', datum.x)", "value": "steelblue"},
            {"value": "#ccc"}
          ]
        }
      }
    }
  ]
}
