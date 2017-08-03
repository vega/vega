import {ValidAggregateOps} from '../src/transforms/aggregate/Aggregate';
import {ValidWindowOps} from '../src/transforms/aggregate/WindowOp';

var ValidOps = ValidWindowOps.concat(ValidAggregateOps);

export default {
  "type": "Window",
  "metadata": {"modifies": true},
  "params": [
    { "name": "sort", "type": "compare" },
    { "name": "frame", "type": "number", "array": true, "length": 2, "default": [null, 0] },
    { "name": "frameType", "type": "enum", "values": ["range", "rows"], "default": "range" },
    { "name": "groupby", "type": "field", "array": true },
    { "name": "ops", "type": "enum", "array": true, "values": ValidOps },
    { "name": "params", "type": "number", "array": true },
    { "name": "fields", "type": "field", "array": true },
    { "name": "as", "type": "string", "array": true }
  ]
};
