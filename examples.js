var examples = [
  {name: 'bar',              editor: true, row: 0, col: 0, x: [83, 36, 97],    y: [0, -18, 9],   width: 275, height: 105},
  {name: 'linking',          editor: true, row: 0, col: 1, x: [10, 10, 175],   y: [-148, -210, 0], width: 710, height: 300},
  {name: 'choropleth',       editor: true, row: 0, col: 2, x: [120, 15, 125],  y: [0, -65, 5],     width: 348, height: 150},
  {name: 'dimpvis',          editor: true, row: 0, col: 3, x: [91, 25, 134],   y: [-90, -100, -40], width: 946, height: 300},
  {name: 'crossfilter',      editor: true, row: 0, col: 4, x: [71, -25, 240],  y: [-35, -55, 0],   width: 997, height: 250},
  {name: 'driving',          editor: true, row: 1, col: 0, x: [15, 15, 125],   y: [-50, -50, 5],   width: 825, height: 150},
  {name: 'force_drag',       editor: true, row: 1, col: 1, x: [50, 45, 65],    y: [-15, -75, -5],  width: 200, height: 200},
  {name: 'heatmap',          editor: true, row: 1, col: 2, x: [75, 40, 125],   y: [-5, -50, -5],   width: 957, height: 150},
  {name: 'index_chart',      editor: true, row: 1, col: 3, x: [35, -5, 55],    y: [-25, -40, 0],   width: 650, height: 125},
  {name: 'jobs',             editor: true, row: 1, col: 4, x: [120, 15, 120],  y: [0, -65, -5],    width: 880, height: 150},
  {name: 'parallel_coords',  editor: true, row: 2, col: 0, x: [50, 0, 130],   y: [-35, -65, 0],   width: 729, height: 150},
  {name: 'playfair',         editor: true, row: 2, col: 1, x: [50, 20, 115],   y: [-41, -50, 0],   width: 815, height: 135},
  {name: 'population',       editor: true, row: 2, col: 2, x: [69, 40, 105],   y: [0, -50, 5],   width: 657, height: 135},
  {name: 'budget_forecasts', editor: true, row: 2, col: 3, x: [45, 10, 60],    y: [-20, -35, 0],   width: 540, height: 140},
  {name: 'treemap',          editor: true, row: 2, col: 4, x: [67, 0, 85],     y: [-20, -35, 0],     width: 965, height: 140},
];

var width = 700,
    thumb  = width / 5,
    height = thumb/1.5 * (examples.length/5); 

var spec = {
  "width": width,
  "height": height,
  "padding": 0,

  "signals": [
    {
      "name": "active",
      "init": {},
      "streams": [
        {"type": "image:mouseover, group:mouseover, group:mouseout, rect:mouseover", "expr": "eventGroup().datum"},
        {"type": "body:mouseout", "expr": "{}"},
      ]
    },
    {
      "name": "pan",
      "init": {"x": 0, "y": 0},
      "streams": [
        {"type": "body:mouseout", "expr": "{x: 0, y: 0}"},
        {
          "type": "image:mousemove", 
          "expr": "{x: panPrev.x - eventX('example'), y: panPrev.y - eventY('example')}"
        }
      ]
    },
    {
      "name": "panPrev",
      "init": {"x": 0, "y": 0},
      "streams": [
        {
          "type": "image:mouseover, image:mousemove", 
          "expr": "{x: eventX('example'), y: eventY('example')}"
        },
      ]
    }
  ],

  "data": [{ 
    "name": "examples", 
    "values": examples,
    "transform": [
      {
        "type": "formula", 
        "field": "pan_x", 
        "expr": "clamp(active._id == datum._id ? datum.pan_x + pan.x/3 : datum.pan_x || datum.x[0], datum.x[1], datum.x[2])"
      },
      {
        "type": "formula", 
        "field": "pan_y", 
        "expr": "clamp(active._id == datum._id ? datum.pan_y + pan.y/3 : datum.pan_y || datum.y[0], datum.y[1], datum.y[2])"
      },
    ]
  }],

  "predicates": [
    {
      "name": "hovered",
      "type": "==",
      "operands": [{"signal": "active._id"}, {"arg": "id"}]
    }
  ],

  "scales": [
    {
      "name": "x",
      "type": "ordinal",
      "domain": {"data": "examples", "field": "col"},
      "range": "width"
    },
    {
      "name": "y",
      "type": "ordinal",
      "domain": {"data": "examples", "field": "row"},
      "range": "height"
    }
  ],

  "marks": [
    {
      "name": "example",
      "type": "group",
      "from": {"data": "examples"},
      "properties": {
        "enter": {
          "x": {"scale": "x", "field": "col"},
          "width": {"scale": "x", "band": true, "offset": -5},
          "y": {"scale": "y", "field": "row"},
          "height": {"scale": "y", "band": true, "offset": -5},
          "clip": {"value": true},
          "fill": {"value": "#fff"}
        }
      },

      "marks": [
        {
          "name": "example-thumb",
          "type": "image",
          "properties": {
            "enter": {
              "width": {"field": {"parent": "width"}},
              "height": {"field": {"parent": "height"}},
              "url": {"template": "{{parent.name}}.png"},
              "align": {"value": "center"},
              "baseline": {"value": "center"}
            },
            "update": {
              "x": {"field": {"parent": "pan_x"}},
              "y": {"field": {"parent": "pan_y"}}
            }
          }
        },
        {
          "type": "rect",
          "properties": {
            "enter": {
              "x": {"value": 0},
              "y": {"value": 0},
              "width": {"field": {"group": "width"}},
              "height": {"field": {"group": "height"}}
            },
            "update": {
              "stroke": {
                "rule": [
                  {
                    "predicate": {
                      "name": "hovered",
                      "id": {"field": {"parent": "_id"}}
                    },
                    "value": "#d5a928"
                  },
                  {"value": "#888"}
                ]
              },

              "strokeWidth": {
                "rule": [
                  {
                    "predicate": {
                      "name": "hovered",
                      "id": {"field": {"parent": "_id"}}
                    },
                    "value": 3
                  },
                  {"value": 1}
                ]
              }
            }
          }
        }
      ]
    }
  ]
};

var view;
vg.parse.spec(spec, function(chart) {
  view = chart({ el: "#examples", renderer: "svg" })
    .update({});

  view.on('click', function(e, i) {
    if (!i) return;
    if (i.mark.marktype === 'image') i = i.mark.group;
    var d = i.datum;
    window.location = d.editor ? 'http://vega.github.io/vega-editor/index.html?spec=' + d.name : d.url; 
  });
}, {
  load: { baseURL: "images/examples/" }
});