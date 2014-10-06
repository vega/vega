define({
  "width": 400,
  "height": 200,
  "padding": {"top": 10, "left": 30, "bottom": 30, "right": 10},

  "signals": [
    {
      "name": "mouse",
      "init": {"pageX": 0, "pageY": 0},
      "streams": [{"type": "click", "expr": "e"}]
    },
    {
      "name": "mouse2x",
      "init": 0,
      "expr": "mouse.pageX * 2"
    },
    {
      "name": "dataX",
      "init": 0,
      "streams": [{"type": "click", "expr": "d.x"}]
    },
    {
      "name": "itemFill",
      "init": "steelblue",
      "streams": [{"type": "click", "expr": "i.fill"}]
    }
  ],

  "predicates": [
    {
      "name": "currentBar",
      "type": "=",
      "operands": [
        {"signal": "dataX"},
        {"arg": "itemX"}
      ]
    },

    {
      "name": "redFill",
      "type": "=",
      "operands": [
        {"signal": "itemFill"},
        {"value": "red"}
      ]
    },

    {
      "name": "switchHighlight",
      "type": "&&",
      "operands": [
        {"predicate": "currentBar"},
        {"predicate": "redFill"}
      ]
    }
  ],

  "data": [
    {
      "name": "bar",
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
      "type": "ordinal",
      "range": "width",
      "domain": {"data": "bar", "field": "x"}
    },
    {
      "name": "y",
      "range": "height",
      "nice": true,
      "domain": {"data": "bar", "field": "y"}
    }
  ],

  "marks": [
    {
      "type": "rect",
      "_from": "bar",
      "properties": {
        "enter": {
          "x": {"scale": "x", "field": "x"},
          "width": {"scale": "x", "band": true, "offset": -1},
          "y": {"scale": "y", "field": "y"},
          "y2": {"scale": "y", "value": 10}
        },
        "update": {
          "fill": {
            "rule": [
              {
                "predicate": "switchHighlight",
                "input": {"itemX": {"field": "x"}},
                "value": "green"
              },
              {
                "predicate": "currentBar",
                "input": {"itemX": {"field": "x"}},
                "value": "red"
              },
              {"value": "steelblue"}
            ]
          }
        }
      }
    },
    {
      "type": "text",
      "properties": {
        "update": {
          "x": {"value": 10},
          "y": {"scale": "y", "value": 0},
          "fill": {"value": "black"},
          "text": {"signal": "mouse.pageX"}
        }
      }
    },
    {
      "type": "text",
      "properties": {
        "update": {
          "x": {"value": 30},
          "y": {"scale": "y", "value": 0},
          "fill": {"value": "black"},
          "text": {"signal": "mouse.pageY"}
        }
      }
    },
    {
      "type": "text",
      "properties": {
        "update": {
          "x": {"value": 50},
          "y": {"scale": "y", "value": 0},
          "fill": {"value": "black"},
          "text": {"signal": "mouse2x"}
        }
      }
    },
    {
      "type": "text",
      "properties": {
        "update": {
          "x": {"value": 150},
          "y": {"scale": "y", "value": 0},
          "fill": {"signal": "itemFill"},
          "text": {"signal": "itemFill"}
        }
      }
    }
  ]
})