import { Spec } from 'vega';

const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v3.json",

  "title": {
    "text": "Hello World",
    "offset": 15,
    "interactive": true,
    "encode": {
      "update": {
        "fontWeight": { "value": 400 },
        "fontSize": { "value": 12 },
        "fontStyle": { "value": "italic" },
        "fill": { "value": "rgba(0, 0, 0, 0.54)" }
      },
      "hover": {
        "fontStyle": { "value": "italic" },
        "cursor": { "value": "help" }
      }
    }
  }
}
