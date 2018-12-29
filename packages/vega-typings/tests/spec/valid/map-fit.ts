import { Spec } from 'vega';

const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v3.json",
  "width": 700,
  "height": 400,
  "padding": 10,
  "autosize": "pad",

  "signals": [
    {
      "name": "type",
      "value": "mercator",
      "bind": {
        "input": "select",
        "options": [
          "albers",
          "albersUsa",
          "azimuthalEqualArea",
          "azimuthalEquidistant",
          "conicConformal",
          "conicEqualArea",
          "conicEquidistant",
          "equirectangular",
          "gnomonic",
          "mercator",
          "orthographic",
          "stereographic",
          "transverseMercator"
        ]
      }
    },
    {
      "name": "angle",
      "value": 90,
      "bind": {"input": "range", "min": -180, "max": 180, "step": 1}
    }
  ],

  "data": [
    {
      "name": "unemp",
      "url": "data/unemployment.tsv",
      "format": {"type": "tsv", "parse": "auto"}
    },
    {
      "name": "counties",
      "url": "data/us-10m.json",
      "format": {"type": "topojson", "feature": "counties"},
      "transform": [
        {
          "type": "lookup",
          "from": "unemp", "key": "id", "values": ["rate"],
          "fields": ["id"], "as": ["unemp"]
        },
        { "type": "filter", "expr": "datum.unemp != null" }
      ]
    }
  ],

  "projections": [
    {
      "name": "projection",
      "type": {"signal": "type"},
      "rotate": [{"signal": "angle"}, 0, 0],
      "fit": {"signal": "data('counties')"},
      "size": {"signal": "[width, height]"}
    }
  ],

  "scales": [
    {
      "name": "color",
      "type": "quantize",
      "domain": [0, 0.15],
      "range": {"scheme": "blues-9"}
    }
  ],

  "legends": [
    {
      "fill": "color",
      "orient": "right",
      "title": "Unemployment",
      "format": "0.1%",
      "encode": {
        "symbols": {
          "update": {
            "shape": {"value": "square"},
            "stroke": {"value": "#ccc"},
            "strokeWidth": {"value": 0.2}
          }
        }
      }
    }
  ],

  "marks": [
    {
      "type": "shape",
      "from": {"data": "counties"},
      "encode": {
        "update": { "fill": {"scale": "color", "field": "unemp"} },
        "hover": { "fill": {"value": "red"} }
      },
      "transform": [
        { "type": "geoshape", "projection": "projection" }
      ]
    }
  ]
}
