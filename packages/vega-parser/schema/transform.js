function transformSchema(name, def) {
  function parameters(list) {
    list.forEach(function(param) {
      if (param.type === 'param') {
        if (!param.array) throw Error('Param-type must be an array!');
        props[param.name] = {
          "type": "array",
          "items": {
            "oneOf": param.params.map(subParameterSchema)
          }
        }
      } else if (param.params) {
        parameters(param.params)
      } else {
        props[param.name] = parameterSchema(param);
        if (param.required) required.push(param.name);
      }
    })
  }

  var props = {"type": {"enum": [name]}},
      required = ["type"];

  parameters(def.params || []);

  var schema = {
    "type": "object",
    "properties": props,
    "additionalProperties": false,
    "required": required
  };

  return schema;
}

function parameterSchema(param) {
  var p = {};

  switch (param.type) {
    case "projection":
    case "data":
      p = {"type": "string"};
      break;
    case "field":
      p = {"$ref": "#/refs/scaleField"};
      break;
    case "compare":
      p = {
        "type": "object",
        "properties": {
          "oneOf": [
            {
              "field": {
                "oneOf": [
                  {"type": "string"},
                  {"$ref": "#/refs/signal"}
                ]
              },
              "order": {
                "oneOf": [
                  {"enum": ["ascending", "descending"]},
                  {"$ref": "#/refs/signal"}
                ]
              },
            },
            {
              "field": {
                "type": "array",
                "items": {
                  "anyOf": [
                    {"type": "string"},
                    {"$ref": "#/refs/signal"}
                  ]
                }
              },
              "order": {
                "type": "array",
                "items": {
                  "anyOf": [
                    {"enum": ["ascending", "descending"]},
                    {"$ref": "#/refs/signal"}
                  ]
                }
              }
            }
          ]
        }
      };
      break;
    case "enum":
      p = {
        "anyOf": [
          {"enum": param.values},
          {"$ref": "#/refs/signal"}
        ]
      };
      break;
    case "expr":
      p = {"$ref": "#/refs/exprString"};
      break;
    case "string":
      p = {"anyOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]};
      break;
    case "number":
      p = {"anyOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]};
      break;
    case "boolean":
      p = {"anyOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}]};
      break;
  }

  if (param.array) {
    p = {
      "oneOf": [
        {"type": "array", "items": p},
        {"$ref": "#/refs/signal"}
      ]
    };
    if (param.length != null) {
      p.minItems = p.maxItems = param.length;
    }
  }

  if (param.default) {
    p.default = param.default;
  }

  return p;
}

function subParameterSchema(sub) {
  var props = {},
      required = [],
      key = sub.key;

  for (var name in key) {
    props[name] = {"enum": [key[name]]};
    required.push(name);
  }

  sub.params.forEach(function(param) {
    props[param.name] = parameterSchema(param);
    if (param.required) required.push(param.name);
  })
  var schema = {
    "type": "object",
    "properties": props,
    "additionalProperties": false,
    "required": required
  };

  return schema;
}

export default function(definitions) {
  var transforms = [];

  for (var name in definitions) {
    transforms.push(transformSchema(name, definitions[name]));
  }

  return {
    "defs": {
      "transform": {
        "oneOf": transforms
      }
    }
  };
}
