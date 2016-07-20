import entry from './entry';
import set from './set';
import expression from '../expression';
import {extend} from 'vega-util';

export default function(channel, rules, scope, params, fields) {
  var code = '';

  rules.forEach(function(rule, index) {
    var value = entry(channel, rule, scope, params, fields),
        expr;

    if (index > 0) code += 'else';

    if (rule.test) {
      expr = expression(rule.test, scope);
      expr.$fields.forEach(function(name) { fields[name] = 1; });
      extend(params, expr.$params);
      code += 'if(' + expr.$expr + ')';
    }

    code += '{' + set('o', channel, value) + '}';
  });

  return code;
}
