{
  "width": 500,
  "height": 200,
  "data": [
    {
      "name": "stocks",
      "url": "data/stocks.csv",
      "format": {"type": "csv", "parse": {"price":"number", "date":"date"}}
    }
  ],
  "scales": [
    {
      "name": "x",
      "type": "time",
      "range": "width",
      "domain": {"data": "stocks", "field": "data.date"}
    },
    {
      "name": "y",
      "type": "linear",
      "range": "height",
      "nice": true,
      "domain": {"data": "stocks", "field": "data.price"}
    },
    {
      "name": "color", "type": "ordinal", "range": "category10"
    }
  ],
  "axes": [
    {"type": "x", "scale": "x", "tickSizeEnd": 0},
    {"type": "y", "scale": "y"}
  ],
  "marks": [
    {
      "type": "group",
      "from": {
        "data": "stocks",
        "transform": [{"type": "facet", "keys": ["data.symbol"]}]
      },
      "marks": [
        {
          "type": "line",
          "properties": {
            "enter": {
              "x": {"scale": "x", "field": "data.date"},
              "y": {"scale": "y", "field": "data.price"},
              "stroke": {"scale": "color", "field": "data.symbol"},
              "strokeWidth": {"value": 2}
            }
          }
        },
        {
          "type": "text",
          "from": {
            "transform": [{"type": "filter", "test": "index==data.length-1"}]
          },
          "properties": {
            "enter": {
              "x": {"scale": "x", "field": "data.date", "offset": 2},
              "y": {"scale": "y", "field": "data.price"},
              "fill": {"scale": "color", "field": "data.symbol"},
              "text": {"field": "data.symbol"},
              "baseline": {"value": "middle"}
            }
          }
        }
      ]
    }
  ]
}