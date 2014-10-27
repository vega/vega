define({
  "width": 400,
  "height": 200,
  "padding": {"top": 10, "left": 30, "bottom": 30, "right": 10},

  "signals": [
    {
      "name": "brush_start",
      "init": {"x": 0, "y": 0},
      "streams": [{"type": "mousedown", "expr": "p"}]
    },
    {
      "name": "brush_end",
      "init": {"x": 0, "y": 0},
      "streams": [{"type": "mouseup", "expr": "p"}]
    }
  ],

  "predicates": [
    {
      "name": "xRange",
      "type": "in",
      "item": {"arg": "x"},
      "range": [{"signal": "brush_start.x"}, {"signal": "brush_end.x"}],
      "scale": {"arg": "xScale"}
    },

    {
      "name": "yRange",
      "type": "in",
      "item": {"arg": "y"},
      "range": [{"signal": "brush_start.y"}, {"signal": "brush_end.y"}],
      "scale": {"arg": "yScale"}
    },

    {
      "name": "inRange",
      "type": "&&",
      "operands": [
        {"predicate": "xRange"},
        {"predicate": "yRange"}
      ]
    }
  ],

  "data": [
    {
      "name": "points",
      "values": [
        {"x": 1,  "y": 28}, {"x": 2,  "y": 55},
        {"x": 3,  "y": 43}, {"x": 4,  "y": 91},
        {"x": 5,  "y": 81}, {"x": 6,  "y": 53},
        {"x": 7,  "y": 19}, {"x": 8,  "y": 87},
        {"x": 9,  "y": 52}, {"x": 10, "y": 48},
        {"x": 11, "y": 24}, {"x": 12, "y": 49},
        {"x": 13, "y": 87}, {"x": 14, "y": 66},
        {"x": 15, "y": 17}, {"x": 16, "y": 27},
        {"x": 17, "y": 68}, {"x": 18, "y": 16},
        {"x": 19, "y": 49}, {"x": 20, "y": 15}
      ]
    }
  ],
  "scales": [
    {
      "name": "x",
      "range": "width",
      "domain": {"data": "points", "field": "x"}
    },
    {
      "name": "y",
      "range": "height",
      "nice": true,
      "domain": {"data": "points", "field": "y"}
    }
  ],

  "marks": [
    {
      "type": "symbol",
      "_from": "points",
      "properties": {
        "enter": {
          "x": {"scale": "x", "field": "x"},
          "y": {"scale": "y", "field": "y"},
          "size": {"value": 100}
        },
        "update": {
          "fill": {
            "rule": [
              {
                "predicate": "inRange",
                "input": {
                  "x": {"field": "x"},
                  "y": {"field": "y"},
                  "xScale": {"scale": "x"},
                  "yScale": {"scale": "y"}
                },

                "value": "steelblue"
              },
              {"value": "grey"}
            ]
          }
        }
      }
    },

    {
      "type": "rect",
      "properties": {
        "update": {
          "x": {"signal": "brush_start.x"},
          "x2": {"signal": "brush_end.x"},
          "y": {"signal": "brush_start.y"},
          "y2": {"signal": "brush_end.y"},
          "fill": {"value": "grey"},
          "fillOpacity": {"value": 0.2}
        }
      }
    }
  ]
})