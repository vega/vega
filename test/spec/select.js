define({
  "width": 400,
  "height": 200,
  // "padding": {"top": 10, "left": 30, "bottom": 30, "right": 10},

  "signals": [
    {
      "name": "clickedPt",
      "init": 0,
      "streams": [{"type": "click", "expr": "d.x"}]
    },
    {
      "name": "shift",
      "init": false,
      "streams": [{"type": "click", "expr": "e.shiftKey"}]
    }
  ],

  "predicates": [
    {
      "name": "clearPts",
      "type": "==",
      "operands": [{"signal": "shift"}, {"value": false}]
    },
    {
      "name": "isSelected",
      "type": "in",
      "item": {"arg": "id"},
      "data": "selectedPts",
      "field": "id",
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
    },
    {
      "name": "selectedPts",
      "modify": [
        {
          "type": "clear",
          "predicate": "clearPts"
        },
        {
          "type": "toggle",
          "signal": "clickedPt",
          "field": "id"
        }
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
      "from": {"data": "points"},
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
                "predicate": "isSelected",
                "input": {
                  "id": {"field": "x"}
                },

                "value": "steelblue"
              },
              {"value": "grey"}
            ]
          }
        }
      }
    }
  ]
})