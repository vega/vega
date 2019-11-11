import { Spec } from 'vega';

export const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "width": 400,
  "height": 300,
  "padding": 5,
  "autosize": "pad",

  "signals": [
    {
      "name": "bandwidthX", "value": -1,
      "bind": {"input": "range", "min": -1, "max": 100, "step": 1}
    },
    {
      "name": "bandwidthY", "value": -1,
      "bind": {"input": "range", "min": -1, "max": 100, "step": 1}
    }
  ],

  "data": [
    {
      "name": "source",
      "url": "data/cars.json",
      "transform": [
        {
          "type": "filter",
          "expr": "datum.Horsepower != null && datum.Miles_per_Gallon != null && datum.Acceleration != null"
        }
      ]
    },
    {
      "name": "density",
      "source": "source",
      "transform": [
        {
          "type": "kde2d",
          "size": [{"signal": "width"}, {"signal": "height"}],
          "x": {"expr": "scale('x', datum.Horsepower)"},
          "y": {"expr": "scale('y', datum.Miles_per_Gallon)"},
          "bandwidth": {"signal": "[bandwidthX, bandwidthY]"}
        },
        {
          "type": "formula", "as": "extent",
          "expr": "extent(datum.grid.values)"
        }
      ]
    }
  ],

  "scales": [
    {
      "name": "x",
      "type": "linear",
      "round": true,
      "nice": true,
      "zero": true,
      "domain": {"data": "source", "field": "Horsepower"},
      "range": "width"
    },
    {
      "name": "y",
      "type": "linear",
      "round": true,
      "nice": true,
      "zero": true,
      "domain": {"data": "source", "field": "Miles_per_Gallon"},
      "range": "height"
    },
    {
      "name": "density",
      "type": "linear",
      "zero": true,
      "domain": [0, 1],
      "range": {"scheme": "viridis"}
    }
  ],

  "axes": [
    {
      "scale": "x",
      "domain": false,
      "orient": "bottom",
      "tickCount": 5,
      "title": "Horsepower"
    },
    {
      "scale": "y",
      "domain": false,
      "orient": "left",
      "titlePadding": 5,
      "title": "Miles_per_Gallon"
    }
  ],

  "legends": [
    {"fill": "density", "title": "Density"}
  ],

  "marks": [
    {
      "type": "image",
      "from": {"data": "density"},
      "encode": {
        "update": {
          "x": {"value": 0},
          "y": {"value": 0},
          "width": {"signal": "width"},
          "height": {"signal": "height"},
          "aspect": {"value": false}
        }
      },
      "transform": [
        {
          "type": "heatmap",
          "field": "datum.grid",
          "color": {"expr": "scale('density', datum.$value / datum.$max)"},
          "opacity": 1
        }
      ]
    }
  ]
};
