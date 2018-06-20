export default {
  "refs": {
    "expr": {
      "title": "ExpressionRef",
      "type": "object",
      "properties": {
        "expr": {"type": "string"},
        "as": {"type": "string"}
      },
      "required": ["expr"]
    },
    "exprString": {
      "title": "Expression String",
      "type": "string"
    }
  }
};
