import { Spec } from 'vega';

// https://vega.github.io/editor/#/examples/vega/bar-chart
export const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v4.json",
  "width": 800,
  "height": 500,
  "padding": 5,

  "config": {
    "axis": {
      "domain": false,
      "grid": true,
      "labelFontSize": 12,
      "labelFontWeight": "bold",
      "tickSize": 0
    }
  },

  "data": [
    {
      "name": "drive",
      "url": "data/driving.json"
    }
  ],

  "scales": [
    {
      "name": "x",
      "type": "linear",
      "domain": {"data": "drive", "field": "miles"},
      "range": "width",
      "nice": true,
      "zero": false,
      "round": true
    },
    {
      "name": "y",
      "type": "linear",
      "domain": {"data": "drive", "field": "gas"},
      "range": "height",
      "nice": true,
      "zero": false,
      "round": true
    },
    {
      "name": "align",
      "type": "ordinal",
      "domain": ["left", "right", "top", "bottom"],
      "range": ["right", "left", "center", "center"]
    },
    {
      "name": "base",
      "type": "ordinal",
      "domain": ["left", "right", "top", "bottom"],
      "range": ["middle", "middle", "bottom", "top"]
    },
    {
      "name": "dx",
      "type": "ordinal",
      "domain": ["left", "right", "top", "bottom"],
      "range": [-7, 6, 0, 0]
    },
    {
      "name": "dy",
      "type": "ordinal",
      "domain": ["left", "right", "top", "bottom"],
      "range": [1, 1, -5, 6]
    }
  ],

  "axes": [
    {
      "orient": "top",
      "scale": "x",
      "tickCount": 5
    },
    {
      "orient": "left",
      "scale": "y",
      "tickCount": 5,
      "format": "$0.2f"
    }
  ],

  "marks": [
    {
      "type": "line",
      "from": {"data": "drive"},
      "encode": {
        "enter": {
          "interpolate": {"value": "cardinal"},
          "x": {"scale": "x", "field": "miles"},
          "y": {"scale": "y", "field": "gas"},
          "stroke": {"value": "#000"},
          "strokeWidth": {"value": 3}
        }
      }
    },
    {
      "type": "symbol",
      "from": {"data": "drive"},
      "encode": {
        "enter": {
          "x": {"scale": "x", "field": "miles"},
          "y": {"scale": "y", "field": "gas"},
          "fill": {"value": "#fff"},
          "stroke": {"value": "#000"},
          "strokeWidth": {"value": 1},
          "size": {"value": 49}
        }
      }
    },
    {
      "type": "text",
      "from": {"data": "drive"},
      "encode": {
        "enter": {
          "x": {"scale": "x", "field": "miles"},
          "y": {"scale": "y", "field": "gas"},
          "dx": {"scale": "dx", "field": "side"},
          "dy": {"scale": "dy", "field": "side"},
          "fill": {"value": "#000"},
          "text": {"field": "year"},
          "align": {"scale": "align", "field": "side"},
          "baseline": {"scale": "base", "field": "side"}
        }
      }
    }
  ]
};
