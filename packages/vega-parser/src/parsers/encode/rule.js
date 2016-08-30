import entry from './entry';
import set from './set';
import expression from './expression';

export default function(channel, rules, scope, params, fields) {
  var code = '';

  rules.forEach(function(rule) {
    var value = entry(channel, rule, scope, params, fields);
    code += rule.test
      ? expression(rule.test, scope, params, fields) + '?' + value + ':'
      : value;
  });

  return set('o', channel, code);
}
