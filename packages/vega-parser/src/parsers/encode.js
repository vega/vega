import adjustSpatial from './encode/adjust-spatial';
import applyDefaults from './encode/defaults';
import entry from './encode/entry';
import rule from './encode/rule';

import {parseExpression} from 'vega-functions';
import {extend, isArray, stringValue} from 'vega-util';

export default function(encode, type, role, style, scope, params) {
  const enc = {};
  params = params || {};
  params.encoders = {$encode: enc};

  encode = applyDefaults(encode, type, role, style, scope.config);
  for (const key in encode) {
    enc[key] = parseBlock(encode[key], type, params, scope);
  }

  return params;
}

function parseBlock(block, marktype, params, scope) {
  const fields = {};
  let code = 'var o=item,datum=o.datum,m=0,$;';

  for (const channel in block) {
    const expr = expression(block[channel]);
    code += set('o', channel, codegen(expr, scope, params, fields));
  }

  code += adjustSpatial(block, marktype);
  code += 'return m;';

  return {
    $expr:   code,
    $fields: Object.keys(fields),
    $output: Object.keys(block)
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
