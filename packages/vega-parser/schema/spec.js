export default {
  "defs": {
    "spec": {
      "title": "Vega visualization specification",
      "type": "object",
      "allOf": [
        {"$ref": "#/defs/scope"},
        {
          "properties": {
            "$schema": {"type": "string", "format": "uri"},
            "config": {"type": "object"},
            "description": {"type": "string"},
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
