export default {
  "defs": {
    "spec": {
      "title": "Vega visualization specification",
      "type": "object",
      "allOf": [
        {"$ref": "#/defs/scope"},
        {
          "properties": {
            "width": {"type": "number"},
            "height": {"type": "number"},
            "padding": {"$ref": "#/defs/padding"},
            "autosize": {"$ref": "#/defs/autosize"},
            "background": {"$ref": "#/defs/background"}
          }
        }
      ]
    }
  }
};
