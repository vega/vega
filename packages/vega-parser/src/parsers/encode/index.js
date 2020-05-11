import adjustSpatial from './adjust-spatial';
import applyDefaults from './defaults';
import entry from './entry';
import rule from './rule';

import {parseExpression} from 'vega-functions';
import {extend, isArray, stringValue} from 'vega-util';

export default function(encode, type, role, style, scope, params) {
  var enc, key;
  params = params || {};
  params.encoders = {$encode: (enc = {})};

  encode = applyDefaults(encode, type, role, style, scope.config);

  for (key in encode) {
    enc[key] = parseEncode(encode[key], type, params, scope);
  }

  return params;
}

function parseEncode(encode, marktype, params, scope) {
  const fields = {};
  let code = 'var o=item,datum=o.datum,m=0,$;';

  for (const channel in encode) {
    const expr = expression(encode[channel]);
    code += set('o', channel, codegen(expr, scope, params, fields));
  }

  code += adjustSpatial(encode, marktype);
  code += 'return m;';

  return {
    $expr:   code,
    $fields: Object.keys(fields),
    $output: Object.keys(encode)
  };
}

function expression(enc) {
  return isArray(enc) ? rule(enc) : entry(enc);
}

function codegen(code, scope, params, fields) {
  const expr = parseExpression(code, scope);
  expr.$fields.forEach(name => fields[name] = 1);
  extend(params, expr.$params);
  return expr.$expr;
}

function set(obj, key, value) {
  const o = obj + '[' + stringValue(key) + ']';
  return `$=${value};if(${o}!==$)${o}=$,m=1;`;
}
