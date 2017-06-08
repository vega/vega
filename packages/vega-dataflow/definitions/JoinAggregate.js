export default {
  "type": "JoinAggregate",
  "metadata": {"modifies": true},
  "params": [
    { "name": "groupby", "type": "field", "array": true },
    { "name": "fields", "type": "field", "array": true },
    { "name": "ops", "type": "enum", "array": true,
      "values": [
        "count", "valid", "missing", "distinct",
        "sum", "mean", "average",
        "variance", "variancep", "stdev", "stdevp", "stderr",
        "median", "q1", "q3", "ci0", "ci1",
        "min", "max", "argmin", "argmax" ] },
    { "name": "as", "type": "string", "array": true },
    { "name": "key", "type": "field" }
  ]
};
