import { Spec } from 'vega';

// https://vega.github.io/editor/#/examples/vega/bar-chart
export const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v3.json",
  "width": 300,
  "height": 200,
  "padding": 5,

  "signals": [
    {
      "name": "labelFlush", "value": true,
      "bind": {"input": "select", "options": [true, false, null, 0, 1, 5]}
    },
    {
      "name": "labelOverlap", "value": true,
      "bind": {"input": "select", "options": [true, false, "parity", "greedy"]}
    },
    {
      "name": "labelBound", "value": -1,
      "bind": {"input": "range", "min": -1, "max": 30, "step": 1}
    },
    {
      "name": "labelFlushOffset", "value": 0,
      "bind": {"input": "range", "min": 0, "max": 10, "step": 1}
    },
    {
      "name": "scalePadding", "value": 0,
      "bind": {"input": "range", "min": 0, "max": 10, "step": 1}
    }
  ],

  "scales": [
    {
      "name": "forwardx",
      "domain": [0, 1000000],
      "padding": {"signal": "scalePadding"},
      "range": "width"
    },
    {
      "name": "backwardx",
      "domain": [0, 1000000],
      "padding": {"signal": "scalePadding"},
      "range": "width",
      "reverse": true
    },
    {
      "name": "forwardy",
      "domain": [0, 1000000],
      "padding": {"signal": "scalePadding"},
      "range": "height"
    },
    {
      "name": "backwardy",
      "domain": [0, 1000000],
      "padding": {"signal": "scalePadding"},
      "range": "height",
      "reverse": true
    }
  ],

  "axes": [
    {
      "orient": "top",
      "scale": "forwardx",
      "format": "s",
      "labelFlush": {"signal": "labelFlush"},
      "labelFlushOffset": {"signal": "labelFlushOffset"},
      "labelOverlap": {"signal": "labelOverlap"},
      "labelBound": {"signal": "labelBound"}
    },
    {
      "orient": "bottom",
      "scale": "backwardx",
      "labelFlush": {"signal": "labelFlush"},
      "labelFlushOffset": {"signal": "labelFlushOffset"},
      "labelOverlap": {"signal": "labelOverlap"},
      "labelBound": {"signal": "labelBound"}
    },
    {
      "orient": "left",
      "scale": "forwardy",
      "format": "s",
      "labelFlush": {"signal": "labelFlush"},
      "labelFlushOffset": {"signal": "labelFlushOffset"},
      "labelOverlap": {"signal": "labelOverlap"},
      "labelBound": {"signal": "labelBound"}
    },
    {
      "orient": "right",
      "scale": "backwardy",
      "labelFlush": {"signal": "labelFlush"},
      "labelFlushOffset": {"signal": "labelFlushOffset"},
      "labelOverlap": {"signal": "labelOverlap"},
      "labelBound": {"signal": "labelBound"}
    }
  ]
};
