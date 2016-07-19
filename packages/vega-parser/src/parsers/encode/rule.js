import entry from './entry';
import set from './set';
import signal from './signal';
import expression from '../expression';

export default function(channel, rules, scope, params, fields) {
  var code = '';

  rules.forEach(function(rule, index) {
    var value = entry(channel, rule, scope, params, fields),
        expr;

    if (index > 0) code += 'else';

    if (rule.test) {
      // TODO data and scale dependencies
      expr = expression(rule.test, scope);
      expr.$fields.forEach(function(name) { fields[name] = 1; });
      expr.$params.forEach(function(name) { signal(name, scope, params); });
      code += 'if(' + expr.$expr + ')';
    }

    code += '{' + set('o', channel, value) + '}';
  });

  return code;
}
