define({
  "width": 200,
  "height": 200,
  // "padding": {"top": 10, "left": 30, "bottom": 30, "right": 10},

  "signals": [
    {
      "name": "clickedPt",
      "init": 0,
      "streams": [{"type": "click", "expr": "d._id"}]
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
      "name": "iris",
      "url": "data/iris.json"
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
      "range": "width", "zero": false,
      "domain": {"data": "iris", "field": "sepalWidth"}
    },
    {
      "name": "y",
      "range": "height",
      "nice": true, "zero": false,
      "domain": {"data": "iris", "field": "petalLength"}
    },
    {
      "name": "c",
      "type": "ordinal",
      "domain": {"data": "iris", "field": "species"},
      "range": ["#800", "#080", "#008"]
    }
  ],

  "axes": [
    {"type": "x", "scale": "x", "offset": 5, "ticks": 5, "title": "Sepal Width"},
    {"type": "y", "scale": "y", "offset": 5, "ticks": 5, "title": "Petal Length"}
  ],

  "marks": [
    {
      "type": "symbol",
      "from": {"data": "iris"},
      "properties": {
        "enter": {
          "x": {"scale": "x", "field": "sepalWidth"},
          "y": {"scale": "y", "field": "petalLength"},
          "fillOpacity": {"value": 0.5},
          "size": {"value": 100}
        },
        "update": {
          "fill": {
            "rule": [
              {
                "predicate": "isSelected",
                "input": {
                  "id": {"field": "_id"}
                },

                "scale": "c", 
                "field": "species"
              },
              {"value": "grey"}
            ]
          }
        }
      }
    }
  ]
})