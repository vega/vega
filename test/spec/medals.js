define({
  "width": 300,
  "height": 240,
  
  "signals": [
    {"name": "_filter", "init": 10},
    {"name": "_formula", "init": 1},
    {"name": "_sortBy", "init": "medals"},
    {"name": "_sortOrder", "init": "+"}
  ],

  "data": [
    {
      "name":"zip",
      "values": [{"zip2": "A"}, {"zip2": "B"}, {"zip2": "C"}]
    },
    {
      "name": "stats",
      "values": [
        {"country": "US", "gdp": 15680, "pop": 360, "athletes": 241},
        {"country": "Canada", "gdp": 1821, "pop": 34, "athletes": 90},
        {"country": "Mexico", "gdp": 1177, "pop": 120, "athletes": 78},
        {"country": "Belize", "gdp": 1.5, "pop": 0.324, "athletes": 5},
      ]
    },
    {
      "name": "medals",
      "values": [
        {"country":"US", "gold":12, "silver":13, "bronze":15},
        {"country":"Canada", "gold": 5, "silver": 4, "bronze": 3},
        {"country":"Mexico", "gold": 3, "silver": 3, "bronze": 2},
        {"country":"Belize", "gold": 0, "silver": 0, "bronze": 0}
      ],
      "transform": [
        {"type": "fold", "fields": ["gold", "silver", "bronze"], "output": {"key": "type", "value": "medals"}},
        {"type": "zip", "with": "zip", "key": "country", "as": "ij", "default": {}},
        {"type": "facet", "keys": ["country"], "transform": [
          {"type": "formula", "field": "all", "expr": "(d.gold + d.silver + d.bronze) * _formula"},
          {"type": "filter", "test": "d.all >= _filter"},
          {"type": "sort", "by": "_sortOrder+_sortBy"},
          {"type": "aggregate", "field": "medals", "stats": ["count", "sum"]}
        ]},
        {"type": "zip", "with": "stats", "key": "key", "withKey": "country", "as": "kj", "default": {}}        
      ]
    }
  ],

  "scales": [
    {
      "name": "x", "type": "ordinal", 
      "domain": {"data": "zip", "field": "zip2"}, 
      "range": "width"
    },
    {
      "name": "countries", "type": "ordinal",
      "domain": {"data": "medals", "field": "key"},
      "range": "width"
    },
    {
      "name": "count", "type": "linear",
      "domain": {"data": "medals", "field": "sum"},
      "range": "height"
    }
  ],

  "marks": [
    {
      "type": "text", 
      "from": {"data": "zip"},
      
      "properties": {
        "enter": {
          "fill": {"value": "black"}
        },
        "update": {
          "x": {"scale": "x", "field": "zip2"},
          "y": {"value": 10},
          "text": {"field": "zip2"}
        }
      }
    },
    {
      "type": "group", 
      "from": {"data": "medals"},

      "properties": {
        "enter": {
          "fill": {"value": "grey"},
          "fillOpacity": {"value": 0.1}
        },
        "update": {
          "x": {"scale": "countries", "field": "key"},
          "width": {"scale": "countries", "band": "true", "offset": -1},
          "y": {"value": 50},
          "y2": {"group": "height", "offset": 50},
          "fill": {"value": "black"}
        }
      },

      "scales": [
        {
          "name": "medals", "type": "ordinal",
          "domain": {"field": "type"},
          "range": "width"
        }
      ],

      "marks": [
        {
          "type": "rect",
          "properties": {
            "enter": {"fill": {"value": "steelblue"}},
            "update": {
              "x": {"scale": "medals", "field": "type"},
              "width": {"scale": "medals", "band": "true", "offset": -1},
              "y": {"scale": "count", "field": "medals"},
              "y2": {"scale": "count", "value": 0}
            }
          }
        }
      ]
    }
  ]
})