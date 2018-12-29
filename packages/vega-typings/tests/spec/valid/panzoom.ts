import { Spec } from 'vega';

const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v3.json",
  "padding": {
    "top":    10,
    "left":   30,
    "bottom": 30,
    "right":  10
  },
  "autosize": "none",

  "signals": [
    {
      "name": "margin",
      "value": 20
    },
    {
      "name": "width",
      "update": "(windowSize()[0] || 500) - padding.left - padding.right - margin",
      "on": [{
        "events": {"source": "window", "type": "resize"},
        "update": "windowSize()[0] - padding.left - padding.right - margin"
      }]
    },
    {
      "name": "height",
      "update": "(windowSize()[1] || 500) - padding.top - padding.bottom - 3 * margin",
      "on": [{
        "events": {"source": "window", "type": "resize"},
        "update": "windowSize()[1] - padding.top - padding.bottom - 3 * margin"
      }]
    },
    {
      "name": "hover",
      "on": [
        {"events": "*:mouseover", "encode": "hover"},
        {"events": "*:mouseout",  "encode": "leave"},
        {"events": "*:mousedown", "encode": "select"},
        {"events": "*:mouseup",   "encode": "release"}
      ]
    },
    {
      "name": "xoffset",
      "update": "-(height + padding.bottom)"
    },
    {
      "name": "yoffset",
      "update": "-(width + padding.left)"
    },
    { "name": "xrange", "update": "[0, width]" },
    { "name": "yrange", "update": "[height, 0]" },

    {
      "name": "down", "value": null,
      "on": [
        {"events": "touchend", "update": "null"},
        {"events": "mousedown, touchstart", "update": "xy()"}
      ]
    },
    {
      "name": "xcur", "value": null,
      "on": [
        {
          "events": "mousedown, touchstart, touchend",
          "update": "slice(xdom)"
        }
      ]
    },
    {
      "name": "ycur", "value": null,
      "on": [
        {
          "events": "mousedown, touchstart, touchend",
          "update": "slice(ydom)"
        }
      ]
    },
    {
      "name": "delta", "value": [0, 0],
      "on": [
        {
          "events": [
            {
              "source": "window", "type": "mousemove", "consume": true,
              "between": [{"type": "mousedown"}, {"source": "window", "type": "mouseup"}]
            },
            {
              "type": "touchmove", "consume": true,
              "filter": "event.touches.length === 1"
            }
          ],
          "update": "down ? [down[0]-x(), y()-down[1]] : [0,0]"
        }
      ]
    },

    {
      "name": "anchor", "value": [0, 0],
      "on": [
        {
          "events": "wheel",
          "update": "[invert('xscale', x()), invert('yscale', y())]"
        },
        {
          "events": {"type": "touchstart", "filter": "event.touches.length===2"},
          "update": "[(xdom[0] + xdom[1]) / 2, (ydom[0] + ydom[1]) / 2]"
        }
      ]
    },
    {
      "name": "zoom", "value": 1,
      "on": [
        {
          "events": "wheel!",
          "force": true,
          "update": "pow(1.001, event.deltaY * pow(16, event.deltaMode))"
        },
        {
          "events": {"signal": "dist2"},
          "force": true,
          "update": "dist1 / dist2"
        }
      ]
    },
    {
      "name": "dist1", "value": 0,
      "on": [
        {
          "events": {"type": "touchstart", "filter": "event.touches.length===2"},
          "update": "pinchDistance(event)"
        },
        {
          "events": {"signal": "dist2"},
          "update": "dist2"
        }
      ]
    },
    {
      "name": "dist2", "value": 0,
      "on": [{
        "events": {"type": "touchmove", "consume": true, "filter": "event.touches.length===2"},
        "update": "pinchDistance(event)"
      }]
    },

    {
      "name": "xdom", "update": "slice(xext)", "react": false,
      "on": [
        {
          "events": {"signal": "delta"},
          "update": "[xcur[0] + span(xcur) * delta[0] / width, xcur[1] + span(xcur) * delta[0] / width]"
        },
        {
          "events": {"signal": "zoom"},
          "update": "[anchor[0] + (xdom[0] - anchor[0]) * zoom, anchor[0] + (xdom[1] - anchor[0]) * zoom]"
        }
      ]
    },
    {
      "name": "ydom", "update": "slice(yext)", "react": false,
      "on": [
        {
          "events": {"signal": "delta"},
          "update": "[ycur[0] + span(ycur) * delta[1] / height, ycur[1] + span(ycur) * delta[1] / height]"
        },
        {
          "events": {"signal": "zoom"},
          "update": "[anchor[1] + (ydom[0] - anchor[1]) * zoom, anchor[1] + (ydom[1] - anchor[1]) * zoom]"
        }
      ]
    },
    {
      "name": "size",
      "update": "clamp(20 / span(xdom), 1, 1000)"
    }
  ],

  "data": [
    {
      "name": "points",
      "url": "data/normal-2d.json",
      "transform": [
        { "type": "extent", "field": "u", "signal": "xext" },
        { "type": "extent", "field": "v", "signal": "yext" }
      ]
    }
  ],

  "scales": [
    {
      "name": "xscale", "zero": false,
      "domain": {"signal": "xdom"},
      "range": {"signal": "xrange"}
    },
    {
      "name": "yscale", "zero": false,
      "domain": {"signal": "ydom"},
      "range": {"signal": "yrange"}
    }
  ],

  "axes": [
    {
      "scale": "xscale",
      "orient": "top",
      "domain": false,
      "offset": {"signal": "xoffset"},
      "encode": {
        "labels": {
          "enter": {"font": {"value": "Monaco"}}
        }
      }
    },
    {
      "scale": "yscale",
      "orient": "right",
      "domain": false,
      "offset": {"signal": "yoffset"},
      "encode": {
        "labels": {
          "enter": {"font": {"value": "Monaco"}}
        }
      }
    }
  ],

  "marks": [
    {
      "type": "symbol",
      "from": {"data": "points"},
      "encode": {
        "enter": {
          "fillOpacity": {"value": 0.6},
          "fill": {"value": "steelblue"}
        },
        "update": {
          "x": {"scale": "xscale", "field": "u"},
          "y": {"scale": "yscale", "field": "v"},
          "size": {"signal": "size"}
        },
        "hover":   { "fill": {"value": "firebrick"} },
        "leave":   { "fill": {"value": "steelblue"} },
        "select":  { "size": {"signal": "size", "mult": 5} },
        "release": { "size": {"signal": "size"} }
      }
    }
  ]
}
