import { Spec } from 'vega';

export const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "padding": 5,
  "width": 800,
  "height": 600,
  "autosize": "pad",

  "data": [
    {
      "name": "movies",
      "url": "data/movies.json",
      "transform": [
        {
          "type": "filter",
          "expr": "datum.Rotten_Tomatoes_Rating != null && datum.IMDB_Rating != null"
        }
      ]
    },
    {
      "name": "fit",
      "source": "movies",
      "transform": [
        {
          "type": "regression",
          "method": "quad",
          "x": "Rotten_Tomatoes_Rating",
          "y": "IMDB_Rating",
          "as": ["u", "v"]
        }
      ]
    }
  ],

  "scales": [
    {
      "name": "x",
      "type": "linear",
      "domain": {"data": "movies", "field": "Rotten_Tomatoes_Rating"},
      "range": "width"
    },
    {
      "name": "y",
      "type": "linear",
      "domain": {"data": "movies", "field": "IMDB_Rating"},
      "range": "height"
    }
  ],

  "axes": [
    {"orient": "left", "scale": "y"},
    {"orient": "bottom", "scale": "x"}
  ],

  "marks": [
    {
      "name": "points",
      "type": "symbol",
      "from": {"data": "movies"},
      "encode": {
        "enter": {
          "x": {"scale": "x", "field": "Rotten_Tomatoes_Rating"},
          "y": {"scale": "y", "field": "IMDB_Rating"},
          "size": {"value": 25},
          "fillOpacity": {"value": 0.5}
        }
      }
    },
    {
      "name": "trend",
      "type": "line",
      "from": {"data": "fit"},
      "encode": {
        "enter": {
          "x": {"scale": "x", "field": "u"},
          "y": {"scale": "y", "field": "v"},
          "stroke": {"value": "firebrick"}
        }
      }
    },
    {
      "type": "text",
      "from": {"data": "points"},
      "encode": {
        "enter": {
          "text": {"field": "datum.Title"},
          "fontSize": {"value": 8}
        }
      },
      "transform": [
        {
          "type": "label",
          "avoidMarks": ["trend"],
          "anchor": ["top", "bottom", "right", "left"],
          "offset": [1],
          "size": [{"signal": "width + 60"}, {"signal": "height"}]
        }
      ]
    }
  ]
};
