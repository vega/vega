import entry from './entry';
import set from './set';
import expression from './expression';

export default function(channel, rules, scope, params, fields) {
  var code = '';

  rules.forEach(function(rule, index) {
    var value = entry(channel, rule, scope, params, fields);
    if (index > 0) code += 'else';
    if (rule.test) {
      code += 'if(' + expression(rule.test, scope, params, fields) + ')';
    }
    code += '{' + set('o', channel, value) + '}';
  });

  return code;
}
