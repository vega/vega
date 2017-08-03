import {ValidAggregateOps} from '../src/transforms/aggregate/Aggregate';

export default {
  "type": "Aggregate",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "groupby", "type": "field", "array": true },
    { "name": "fields", "type": "field", "array": true },
    { "name": "ops", "type": "enum", "array": true, "values": ValidAggregateOps },
    { "name": "as", "type": "string", "array": true },
    { "name": "drop", "type": "boolean", "default": true },
    { "name": "cross", "type": "boolean", "default": false },
    { "name": "key", "type": "field" }
  ]
};
