import { Spec } from 'vega';

// https://vega.github.io/editor/#/examples/vega/bar-chart
export const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "width": 300,
  "height": 15,
  "padding": 5,

  "scales": [
    {
      "name": "color",
      "type": "sequential",
      "range": {"scheme": "viridis"},
      "domain": [0, 100]
    }
  ],

  "marks": [
    {
      "type": "rect",
      "encode": {
        "update": {
          "width": {"signal": "width"},
          "height": {"signal": "height"},
          "fill": {"gradient": "color"}
        }
      }
    }
  ]
};
