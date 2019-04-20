import entry from './entry';
import set from './set';
import expression from './expression';
import {peek} from 'vega-util';

export default function(channel, rules, scope, params, fields) {
  var code = '';

  rules.forEach(function(rule) {
    var value = entry(channel, rule, scope, params, fields);
    code += rule.test
      ? expression(rule.test, scope, params, fields) + '?' + value + ':'
      : value;
  });

  // if no else clause, terminate with null (vega/vega#1366)
  if (peek(code) === ':') {
    code += 'null';
  }

  return set('o', channel, code);
}
