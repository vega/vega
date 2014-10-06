define({
  "facetFields": ["key", "kj.gdp", "kj.pop", "kj.athletes", "count", "sum"],
  "valueFields": ["type", "medals", "all", "ij.zip2"],
  "visualProperties": ["x", "width", "y", "y2", "fill"],

  "tasks": [
    {
      "data": "medals",
      "action": "add",
      "values": [{"country":"France", "gold":2, "silver":5, "bronze":6}],
      "label": "add france to ds"
    },

    {
      "data": "stats",
      "action": "add",
      "values": [{"country":"France", "gdp":2613, "pop":65, "bronze":6, "athletes": 132}],
      "label": "add france to stats"
    },

    {
      "data": "stats",
      "action": "remove",
      "where": function(x) { return x.country === "Canada"; },
      "label": "remove canada from stats"
    },

    {
      "data": "medals",
      "action": "remove",
      "where": function(x) { return x.country === "Canada"; },
      "label": "remove canada from medals"
    },

    {
      "data": "medals",
      "action": "update",
      "where": function(x) { return x.country === "Mexico"; },
      "field": "bronze",
      "value": function(x) { return 5; },
      "label": "increase mexico bronze --> 5 (filter 0->1)",
    },

    {
      "data": "medals",
      "action": "update",
      "where": function(x) { return x.country === "Belize"; },
      "field": "bronze",
      "value": function(x) { return 5; },
      "label": "increase belize bronze --> 5 (filter 0->0)",
    },

    {
      "data": "stats",
      "action": "update",
      "where": function(x) { return x.country === "Belize"; },
      "field": "athletes",
      "value": function(x) { return 8; },
      "label": "increase belize athlete --> 8",
    },

    {
      "data": "medals",
      "action": "update",
      "where": function(x) { return x.country === "Mexico"; },
      "field": "bronze",
      "value": function(x) { return 0; },
      "label": "reduce mexico bronze --> 0 (filter 1->0)",
    },

    {
      "data": "medals",
      "action": "update",
      "where": function(x) { return x.country === "US"; },
      "field": "bronze",
      "value": function(x) { return 20; },
      "label": "increase us bronze --> 20 (filter 1->1)",
    },

    {
      "data": "zip",
      "action": "add",
      "values": [{"zip2": "D"}, {"zip2": "E"}],
      "label": "add D,E to zip2",
    },

    {
      "data": "zip",
      "action": "update",
      "where": function(x) { return x.zip2 === "A"; },
      "field": "zip2",
      "value": function(x) { return "F"; },
      "label": "change zip2 A --> F",
    },

    {
      "data": "zip",
      "action": "remove",
      "where": function(x) { return x.zip2 === "B" },
      "label": "remove B from zip"
    },

    {
      "signal": "_filter",
      "value": 5,
      "label": "change filter threshold, 10 --> 5"
    },

    {
      "signal": "_formula",
      "value": 2,
      "label": "change formula expr, *1 --> *2"
    },

    {
      "signal": "_sortOrder",
      "value": "-",
      "label": "change sort to medals desc"
    }
  ]
});