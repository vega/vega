import { Spec } from 'vega';

export const spec: Spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "Test using inline base64-encoded image data.",
  "background": "white",
  "padding": 5,
  "width": 100,
  "height": 100,
  "marks": [
    {
      "type": "image",
      "encode": {
        "update": {
          "x": {"value": 0},
          "width": {"signal": "width"},
          "y": {"value": 0},
          "height": {"signal": "height"},
          "url": {
            "value": "data:image/png;base64,iVBORw0KGgoAAA%20ANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4%20//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU%205ErkJggg=="
          }
        }
      }
    }
  ]
};
