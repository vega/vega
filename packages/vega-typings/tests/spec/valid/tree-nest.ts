import { Spec } from 'vega';

const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v3.json",
  "width": 200,
  "height": 100,
  "padding": 5,

  "signals": [
    {
      "name": "nodeCutoff", "value": 100,
      "bind": {"input": "range", "min": 0, "max": 100}
    },
    {
      "name": "linkCutoff", "value": 70,
      "bind": {"input": "range", "min": 0, "max": 100}
    }
  ],

  "data": [
    {
      "name": "tree",
      "values": [
        {"id": "A", "job": "Doctor", "region": "East"},
        {"id": "B", "job": "Doctor", "region": "East"},
        {"id": "C", "job": "Lawyer", "region": "East"},
        {"id": "D", "job": "Lawyer", "region": "East"},
        {"id": "E", "job": "Doctor", "region": "West"},
        {"id": "F", "job": "Doctor", "region": "West"},
        {"id": "G", "job": "Lawyer", "region": "West"},
        {"id": "H", "job": "Lawyer", "region": "West"}
      ],
      "transform": [
        {
          "type": "nest",
          "generate": true,
          "keys": ["job", "region"]
        },
        {
          "type": "tree",
          "method": "tidy",
          "size": [{"signal": "width"}, {"signal": "height"}]
        },
        {
          "type": "filter",
          "expr": "datum.y <= nodeCutoff"
        }
      ]
    },
    {
      "name": "links",
      "source": "tree",
      "transform": [
        {
          "type": "filter",
          "expr": "datum.y <= linkCutoff"
        },
        {
          "type": "treelinks"
        },
        {
          "type": "linkpath"
        }
      ]
    }
  ],

  "scales": [
    {
      "name": "color",
      "type": "ordinal",
      "range": {"scheme": "category20"}
    }
  ],

  "marks": [
    {
      "type": "path",
      "from": {"data": "links"},
      "encode": {
        "enter": {
          "stroke": {"value": "#ccc"}
        },
        "update": {
          "path": {"field": "path"}
        }
      }
    },
    {
      "type": "symbol",
      "from": {"data": "tree"},
      "encode": {
        "enter": {
          "fill": {"scale": "color", "field": "id"},
          "stroke": {"value": "white"},
          "size": {"value": 400}
        },
        "update": {
          "x": {"field": "x"},
          "y": {"field": "y"}
        }
      }
    }
  ]
}
