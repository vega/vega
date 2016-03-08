{
  "width": 400,
  "height": 400,
  "data": [
    {
      "name": "table",
      "values": [
        {"category":"A", "amount":100},
        {"category":"B", "amount":50}
      ],
      "transform": [
        {"type": "pie", "field": "amount"}
      ]
    }
  ],
  "scales": [
    {
      "name": "r",
      "type": "sqrt",
      "domain": {"data": "table", "field": "amount"},
      "range": [20, 100]
    },
    {
      "name": "color",
      "type": "ordinal",
      "range": "category10",
      "domain": {"data": "table", "field": "category"}
    }
  ],
  "legends": [
    {
      "fill": "color",
      "properties": {
        "symbols": {
          "shape": {
            "value": "star"
          }
        }
      }
    }
  ],
  "marks": [
    {
      "type": "arc",
      "from": {"data": "table"},
      "properties": {
        "enter": {
          "x": {"field": {"group": "width"}, "mult": 0.5},
          "y": {"field": {"group": "height"}, "mult": 0.5},
          "startAngle": {"field": "layout_start"},
          "endAngle": {"field": "layout_end"},
          "outerRadius": {"value": 100},
          "fill": {"scale": "color", "field": "category"}
        }
      }
    }
  ]
}