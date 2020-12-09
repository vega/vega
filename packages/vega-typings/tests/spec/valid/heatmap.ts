import { Spec } from 'vega';

export const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "width": 800,
  "height": 500,
  "padding": 5,

  "config": {
    "title": {"fontSize": 14}
  },

  "title": {
    "text": "Seattle Annual Temperatures",
    "anchor": "start", "offset": 4
  },

  "signals": [
    {
      "name": "palette", "value": "Viridis",
      "bind": {
        "input": "select",
        "options": [
          "Turbo",
          "Viridis",
          "Magma",
          "Inferno",
          "Plasma",
          "Cividis",
          "DarkBlue",
          "DarkGold",
          "DarkGreen",
          "DarkMulti",
          "DarkRed",
          "LightGreyRed",
          "LightGreyTeal",
          "LightMulti",
          "LightOrange",
          "LightTealBlue",
          "Blues",
          "Browns",
          "Greens",
          "Greys",
          "Oranges",
          "Purples",
          "Reds",
          "TealBlues",
          "Teals",
          "WarmGreys",
          "BlueOrange",
          "BrownBlueGreen",
          "PurpleGreen",
          "PinkYellowGreen",
          "PurpleOrange",
          "RedBlue",
          "RedGrey",
          "RedYellowBlue",
          "RedYellowGreen",
          "BlueGreen",
          "BluePurple",
          "GoldGreen",
          "GoldOrange",
          "GoldRed",
          "GreenBlue",
          "OrangeRed",
          "PurpleBlueGreen",
          "PurpleBlue",
          "PurpleRed",
          "RedPurple",
          "YellowGreenBlue",
          "YellowGreen",
          "YellowOrangeBrown",
          "YellowOrangeRed"
        ]
      }
    },
    {
      "name": "reverse", "value": false, "bind": {"input": "checkbox"}
    }
  ],

  "data": [
    {
      "name": "temperature",
      "url": "data/seattle-weather-hourly-normals.csv",
      "format": {"type": "csv", "parse": {"temperature": "number", "date": "date"}},
      "transform": [
        { "type": "formula", "as": "hour", "expr": "hours(datum.date)" },
        { "type": "formula", "as": "day",
          "expr": "datetime(year(datum.date), month(datum.date), date(datum.date))"}
      ]
    }
  ],

  "scales": [
    {
      "name": "x",
      "type": "time",
      "domain": {"data": "temperature", "field": "day"},
      "range": "width"
    },
    {
      "name": "y",
      "type": "band",
      "domain": [
        6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
        0, 1, 2, 3, 4, 5
      ],
      "range": "height"
    },
    {
      "name": "color",
      "type": "linear",
      "range": {"scheme": {"signal": "palette"}},
      "domain": {"data": "temperature", "field": "temperature"},
      "reverse": {"signal": "reverse"},
      "zero": false, "nice": true
    }
  ],

  "axes": [
    {"orient": "bottom", "scale": "x", "domain": false, "title": "Month", "format": "%b"},
    {
      "orient": "left", "scale": "y", "domain": false, "title": "Hour",
      "encode": {
        "labels": {
          "update": {
            "text": {"signal": "datum.value === 0 ? 'Midnight' : datum.value === 12 ? 'Noon' : datum.value < 12 ? datum.value + ':00 AM' : (datum.value - 12) + ':00 PM'"}
          }
        }
      }
    }
  ],

  "legends": [
    {
      "fill": "color",
      "type": "gradient",
      "orient": "none",
      "direction": "vertical",
      "gradientLength": {"signal": "height"},
      "title": "Avg. Temp (°C)",
      "format": "0.1f",
      "encode": {
        "legend": {
          "update": {
            "x": {"signal": "width", "offset": 20},
            "y": {"value": -16}
          }
        }
      }
    }
  ],

  "marks": [
    {
      "type": "rect",
      "from": {"data": "temperature"},
      "encode": {
        "enter": {
          "x": {"scale": "x", "field": "day"},
          "y": {"scale": "y", "field": "hour"},
          "width": {"value": 5},
          "height": {"scale": "y", "band": 1},
          "tooltip": {"signal": "timeFormat(datum.date, '%b %d %I:00 %p') + ': ' + datum.temperature + '°'"}
        },
        "update": {
          "fill": {"scale": "color", "field": "temperature"}
        }
      }
    }
  ]
};
