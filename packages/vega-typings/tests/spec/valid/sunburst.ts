import { Spec } from 'vega';

export const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "width": 600,
  "height": 600,
  "padding": 5,

  "data": [
    {
      "name": "tree",
      "url": "data/flare.json",
      "transform": [
        {
          "type": "stratify",
          "key": "id",
          "parentKey": "parent"
        },
        {
          "type": "partition",
          "field": "size",
          "sort": {
            "field": "value"
          },
          "size": [
            {
              "signal": "2 * PI"
            },
            {
              "signal": "width / 2"
            }
          ],
          "as": ["a0", "r0", "a1", "r1", "depth", "children", "value"]
        }
      ]
    },
    {
      "name": "level1",
      "source": "tree",
      "transform": [
        {
          "type": "filter",
          "expr": "datum.depth == 1"
        }
      ]
    },
    {
      "name": "level2",
      "source": "tree",
      "transform": [
        {
          "type": "filter",
          "expr": "datum.depth == 2"
        }
      ]
    },
    {
      "name": "level3",
      "source": "tree",
      "transform": [
        {
          "type": "filter",
          "expr": "datum.depth == 3"
        }
      ]
    },
    {
      "name": "level4",
      "source": "tree",
      "transform": [
        {
          "type": "filter",
          "expr": "datum.depth == 4"
        }
      ]
    }
  ],

  "scales": [
    {
      "name": "color",
      "type": "ordinal",
      "domain": {"data": "tree", "field": "depth"},
      "range": {"scheme": "tableau20"}
    },
    {
      "name": "opacity_level1",
      "domain": {"data": "level1", "field": "value"},
      "range": [0.5, 1]
    },
    {
      "name": "opacity_level2",
      "domain": {"data": "level3", "field": "value"},
      "range": [0.5, 1]
    },
    {
      "name": "opacity_level3",
      "domain": {"data": "level3", "field": "value"},
      "range": [0.5, 1]
    },
    {
      "name": "opacity_level4",
      "domain": {"data": "level4", "field": "value"},
      "range": [0.5, 1]
    }
  ],

  "marks": [
    {
      "type": "arc",
      "from": {"data": "tree"},
      "encode": {
        "enter": {
          "x": {
            "signal": "width / 2"
          },
          "y": {
            "signal": "height / 2"
          },
          "fill": {
            "scale": "color",
            "field": "depth"
          },
          "opacity": {
            "signal": "scale('opacity_level'+datum.depth, datum.value)"
          },
          "tooltip": {
            "signal": "datum.name + (datum.size ? ', ' + datum.size + ' bytes' : '')"
          }
        },
        "update": {
          "startAngle": {
            "field": "a0"
          },
          "endAngle": {
            "field": "a1"
          },
          "innerRadius": {
            "field": "r0"
          },
          "outerRadius": {
            "field": "r1"
          },
          "stroke": {
            "value": "white"
          },
          "strokeWidth": {
            "value": 0.5
          },
          "zindex": {
            "value": 0
          }
        },
        "hover": {
          "stroke": {
            "value": "red"
          },
          "strokeWidth": {
            "value": 2
          },
          "zindex": {
            "value": 1
          }
        }
      }
    }
  ]
};
