import { Spec } from 'vega';

// https://vega.github.io/editor/#/examples/vega/bar-chart
export const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v4.json",
  "width": 15,
  "padding": 5,
  "autosize": "pad",

  "config": {
    "axisLeft": {
      "titleX": -5,
      "titleY": -2,
      "titleAlign": "right",
      "titleAngle": 0,
      "titleBaseline": "bottom"
    }
  },

  "signals": [
    {
      "name": "cellSize",
      "value": 15
    },
    {
      "name": "height",
      "update": "cellSize * max(0, extent[1])"
    },
    {
      "name": "sortop",
      "value": "count",
      "bind": {"input": "radio", "options": ["count", "min"]}
    },
    {
      "name": "sortorder",
      "value": "descending",
      "bind": {"input": "radio", "options": ["ascending", "descending"]}
    }
  ],

  "data": [
    {
      "name": "source",
      "url": "data/movies.json"
    },
    {
      "name": "layout",
      "source": "source",
      "transform": [
        {
          "type": "aggregate",
          "fields": ["Title"],
          "ops": ["distinct"],
          "signal": "aggregate"
        },
        {
          "type": "extent",
          "field": "distinct_Title",
          "signal": "extent"
        }
      ]
    }
  ],

  "marks": [
    {
      "type": "symbol",
      "from": {"data": "source"},
      "encode": {
        "update": {
          "x": {"value": 10},
          "y": {"scale": "y", "field": "Title"},
          "size": {"value": 36},
          "shape": {"value": "circle"},
          "strokeWidth": {"value": 1.5},
          "opacity": {"value": 0.7},
          "stroke": {"value": "steelblue"},
          "fill": {"value": "transparent"}
        },
        "hover": {
          "stroke": {"value": "firebrick"},
          "cursor": {"value": "pointer"}
        }
      }
    }
  ],

  "scales": [
    {
      "name": "y",
      "type": "point",
      "domain": {
        "data": "source",
        "field": "Title",
        "sort": {
          "field": "Title",
          "op": {"signal": "sortop"},
          "order": {"signal": "sortorder"}
        }
      },
      "range": {"step": {"signal": "cellSize"}},
      "padding": 0.5
    }
  ],

  "axes": [
    {
      "scale": "y",
      "orient": "left",
      "title": "Film Title",
      "encode": {
        "labels": {
          "interactive": true,
          "enter": {
            "text": {"signal": "truncate(datum.label, 25)"}
          },
          "update": {
            "fill": {"value": "black"}
          },
          "hover": {
            "fill": {"value": "firebrick"},
            "cursor": {"value": "pointer"}
          }
        }
      }
    }
  ]
};
