import adjustSpatial from './encode/adjust-spatial';
import entry from './encode/entry';
import rule from './encode/rule';
import set from './encode/set';
import {isArray} from 'vega-util';

export default function parseEncode(encode, marktype, params, scope) {
  var fields = {},
      code = 'var o=item,datum=o.datum,$;',
      channel, enc, value;

  for (channel in encode) {
    enc = encode[channel];
    if (isArray(enc)) { // rule
      code += rule(channel, enc, scope, params, fields);
    } else {
      value = entry(channel, enc, scope, params, fields);
      code += set('o', channel, value);
    }
  }

  code += adjustSpatial(encode, marktype);
  code += 'return 1;';

  return {
    $expr:   code,
    $fields: Object.keys(fields),
    $output: Object.keys(encode)
  };
}
