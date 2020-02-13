import { Spec } from 'vega';

export const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "width": 300,
  "padding": 5,
  "autosize": {"type": "pad", "resize": true},

  "signals": [
    {
      "name": "rangeStep", "value": 12,
      "bind": {"input": "range", "min": 5, "max": 50, "step": 1}
    },
    {
      "name": "innerPadding", "value": 0.1,
      "bind": {"input": "range", "min": 0, "max": 1}
    },
    {
      "name": "outerPadding", "value": 0.2,
      "bind": {"input": "range", "min": 0, "max": 1}
    },
    {
      "name": "rhOffset", "value": 5,
      "bind": {"input": "range", "min": 0, "max": 10, "step": 1}
    },
    {
      "name": "rtOffset", "value": 5,
      "bind": {"input": "range", "min": 0, "max": 10, "step": 1}
    },
    {
      "name": "rtAnchor", "value": "start",
      "bind": {"input": "select", "options": ["start", "end"]}
    },
    {
      "name": "ctAnchor", "value": "start",
      "bind": {"input": "select", "options": ["start", "end"]}
    }
  ],

  "data": [
    {
      "name": "tuples",
      "values": [
        {"a": 0, "b": "a", "c": 6.3},
        {"a": 0, "b": "a", "c": 4.2},
        {"a": 0, "b": "b", "c": 6.8},
        {"a": 0, "b": "c", "c": 5.1},
        {"a": 1, "b": "b", "c": 4.4},
        {"a": 2, "b": "b", "c": 3.5},
        {"a": 2, "b": "c", "c": 6.2}
      ],
      "transform": [
        {
          "type": "aggregate",
          "groupby": ["a", "b"],
          "fields": ["c"],
          "ops": ["average"],
          "as": ["c"]
        }
      ]
    },
    {
      "name": "trellis",
      "source": "tuples",
      "transform": [
        {
          "type": "aggregate",
          "groupby": ["a"]
        }
      ]
    }
  ],

  "scales": [
    {
      "name": "xscale",
      "domain": {"data": "tuples", "field": "c"},
      "nice": true,
      "zero": true,
      "round": true,
      "range": "width"
    },
    {
      "name": "color",
      "type": "ordinal",
      "range": "category",
      "domain": {"data": "trellis", "field": "a"}
    }
  ],

  "layout": {
    "offset": {
      "rowTitle": {"signal": "rtOffset"},
      "rowHeader": {"signal": "rhOffset"}
    },
    "titleAnchor": {
      "row": {"signal": "rtAnchor"},
      "column": {"signal": "ctAnchor"}
    },
    "padding": 0,
    "columns": 1,
    "align": "each",
    "bounds": "full"
  },

  "marks": [
    {
      "name": "facets",
      "type": "group",

      "from": {
        "data": "trellis",
        "facet": {
          "name": "faceted_tuples",
          "data": "tuples",
          "groupby": "a"
        }
      },

      "encode": {
        "enter": {
          "width": {"signal": "width"}
        },
        "update": {
          "height": {"signal": "rangeStep * bandspace(datum.count, innerPadding, outerPadding)"}
        }
      },

      "scales": [
        {
          "name": "yscale",
          "type": "band",
          "paddingInner": {"signal": "innerPadding"},
          "paddingOuter": {"signal": "outerPadding"},
          "round": true,
          "domain": {"data": "faceted_tuples", "field": "b"},
          "range": {"step": {"signal": "rangeStep"}}
        }
      ],

      "marks": [
        {
          "type": "rect",
          "from": {"data": "faceted_tuples"},
          "encode": {
            "enter": {
              "x": {"value": 0},
              "x2": {"scale": "xscale", "field": "c"},
              "fill": {"scale": "color", "field": "a"},
              "strokeWidth": {"value": 2}
            },
            "update": {
              "y": {"scale": "yscale", "field": "b"},
              "height": {"scale": "yscale", "band": 1},
              "stroke": {"value": null},
              "zindex": {"value": 0}
            },
            "hover": {
              "stroke": {"value": "firebrick"},
              "zindex": {"value": 1}
            }
          }
        }
      ]
    },
    {
      "type": "group",
      "role": "row-header",

      "from": {
        "data": "trellis",
        "facet": {
          "name": "faceted_tuples",
          "data": "tuples",
          "groupby": "a"
        }
      },

      "encode": {
        "update": {
          "height": {"signal": "rangeStep * bandspace(datum.count, innerPadding, outerPadding)"}
        }
      },

      "scales": [
        {
          "name": "yscale",
          "type": "band",
          "paddingInner": {"signal": "innerPadding"},
          "paddingOuter": {"signal": "outerPadding"},
          "round": true,
          "domain": {"data": "faceted_tuples", "field": "b"},
          "range": {"step": {"signal": "rangeStep"}}
        }
      ],

      "axes": [
        { "orient": "left", "scale": "yscale", "title": "cell",
          "ticks": false, "domain": false, "labelPadding": 4 }
      ],

      "title": {
        "text": {"signal": "parent.a"},
        "orient": "left",
        "offset": 10,
        "align": "right",
        "baseline": "middle",
        "angle": 0,
        "fontSize": 11
      }
    },
    {
      "role": "row-title",
      "type": "group",
      "marks": [
        {
          "type": "text",
          "encode": {
            "update": {
              "align": {"signal": "rtAnchor === 'end' ? 'left' : 'right'"},
              "baseline": {"value": "middle"},
              "text": {"value": "Row Title"},
              "fontWeight": {"value": "bold"}
            }
          }
        }
      ]
    },
    {
      "role": "column-title",
      "type": "group",
      "marks": [
        {
          "type": "text",
          "encode": {
            "update": {
              "align": {"value": "center"},
              "baseline": {"signal": "ctAnchor === 'end' ? 'top' : 'bottom'"},
              "text": {"value": "Column Title"},
              "fontWeight": {"value": "bold"}
            }
          }
        }
      ]
    },
    {
      "role": "column-footer",
      "type": "group",
      "axes": [
        { "orient": "bottom", "scale": "xscale", "domain": true }
      ]
    }
  ]
};
